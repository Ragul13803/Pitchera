// backend/src/jobs/emailScheduler.ts

import cron from "node-cron";
import fs from "fs";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendEmailViaGmail, sendDraftViaGmail } from "../services/gmail.service";

interface ScheduledEmailRow extends RowDataPacket {
  id: number;
  user_id: number;
  job_application_id: number | null;
  gmail_account_id: number | null;
  recipient_name: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  resume_path: string | null;
  gmail_draft_id: string | null;
  scheduled_at: Date;
  retry_count: number;
  max_retries: number;
}

function isGmailNotFound(error: any): boolean {
  return error?.code === 404 || error?.response?.status === 404;
}

const BATCH_SIZE = 20;
const STUCK_THRESHOLD_MINUTES = 10;

// Lock state reuses the existing 'sending' enum value already defined on
// scheduled_emails.status — no schema change needed for a separate "processing" state.
const LOCK_STATUS = "sending";

/**
 * Claim due emails (status='scheduled', scheduled_at <= now) under a row lock,
 * flip them to the lock status, then send each one outside the transaction.
 */
export async function processDueEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const conn = await pool.getConnection();
  let due: ScheduledEmailRow[] = [];

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<ScheduledEmailRow[]>(
      `SELECT * FROM scheduled_emails
       WHERE status = 'scheduled'
         AND scheduled_at <= UTC_TIMESTAMP()
         AND retry_count < max_retries
       ORDER BY scheduled_at ASC
       LIMIT ?
       FOR UPDATE`,
      [BATCH_SIZE]
    );
    due = rows;

    if (due.length === 0) {
      await conn.commit();
      return { processed: 0, sent: 0, failed: 0 };
    }

    const ids = due.map((r) => r.id);
    await conn.query(
      `UPDATE scheduled_emails SET status = ?, updated_at = UTC_TIMESTAMP() WHERE id IN (?)`,
      [LOCK_STATUS, ids]
    );

    await conn.commit();
  } catch (error: any) {
    await conn.rollback();
    console.error("[Scheduler] Failed to claim due emails:", error.message);
    return { processed: 0, sent: 0, failed: 0 };
  } finally {
    conn.release();
  }

  console.log(`[Scheduler] Tick — processing ${due.length} due email(s)`);

  let sent = 0;
  let failed = 0;
  const touchedJobApplicationIds = new Set<number>();

  for (const email of due) {
    const attachments =
      email.resume_path && fs.existsSync(email.resume_path)
        ? [email.resume_path]
        : [];

    try {
      // Subject/body were already personalized at schedule time — send as-is.
      let messageId: string;

      if (email.gmail_draft_id) {
        try {
          messageId = await sendDraftViaGmail(email.user_id, email.gmail_draft_id);
        } catch (draftError: any) {
          if (!isGmailNotFound(draftError)) throw draftError;
          // Draft was deleted/edited away in Gmail — fall back to a direct send.
          console.warn(
            `[Scheduler] Draft ${email.gmail_draft_id} missing for email #${email.id}, sending directly`
          );
          messageId = await sendEmailViaGmail(
            email.user_id,
            email.recipient_email,
            email.subject,
            email.body,
            attachments
          );
        }
      } else {
        messageId = await sendEmailViaGmail(
          email.user_id,
          email.recipient_email,
          email.subject,
          email.body,
          attachments
        );
      }

      await pool.query(
        `UPDATE scheduled_emails
         SET status = 'sent', gmail_message_id = ?, sent_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [messageId, email.id]
      );

      await pool.query<ResultSetHeader>(
        `INSERT INTO email_logs
         (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email,
          subject, body, status, gmail_message_id, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, UTC_TIMESTAMP())`,
        [
          email.user_id,
          email.job_application_id,
          email.gmail_account_id,
          email.recipient_name,
          email.recipient_email,
          email.subject,
          email.body,
          messageId,
        ]
      );

      sent++;
      console.log(
        `[Scheduler] ✅ Sent scheduled email #${email.id} to ${email.recipient_email}`
      );
    } catch (error: any) {
      const newRetryCount = email.retry_count + 1;
      const exhausted = newRetryCount >= email.max_retries;

      await pool.query(
        `UPDATE scheduled_emails
         SET status = ?, retry_count = ?, error_message = ?, updated_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [exhausted ? "failed" : "scheduled", newRetryCount, error.message, email.id]
      );

      if (exhausted) {
        await pool.query<ResultSetHeader>(
          `INSERT INTO email_logs
           (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email,
            subject, body, status, error_message)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'failed', ?)`,
          [
            email.user_id,
            email.job_application_id,
            email.gmail_account_id,
            email.recipient_name,
            email.recipient_email,
            email.subject,
            email.body,
            error.message,
          ]
        );
        failed++;
      }

      console.error(
        `[Scheduler] ❌ Failed scheduled email #${email.id} to ${email.recipient_email}: ${error.message}`
      );
    }

    if (email.job_application_id) {
      touchedJobApplicationIds.add(email.job_application_id);
    }
  }

  for (const jobApplicationId of touchedJobApplicationIds) {
    await finalizeJobApplicationStatus(jobApplicationId);
  }

  console.log(
    `[Scheduler] Tick complete — sent ${sent}, failed ${failed} of ${due.length}`
  );
  return { processed: due.length, sent, failed };
}

/**
 * Once no scheduled_emails rows remain pending/in-flight for a job application,
 * roll its status up to 'sent' (at least one email sent) or 'failed' (all failed).
 */
async function finalizeJobApplicationStatus(
  jobApplicationId: number
): Promise<void> {
  const [pending] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM scheduled_emails
     WHERE job_application_id = ? AND status IN ('scheduled', ?)`,
    [jobApplicationId, LOCK_STATUS]
  );
  if (pending[0].count > 0) return;

  const [sentRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM scheduled_emails
     WHERE job_application_id = ? AND status = 'sent'`,
    [jobApplicationId]
  );
  const finalStatus = sentRows[0].count > 0 ? "sent" : "failed";

  await pool.query(
    `UPDATE job_applications
     SET status = ?, applied_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
     WHERE id = ? AND status = 'scheduled'`,
    [finalStatus, jobApplicationId]
  );
}

/**
 * Recover rows stuck in the lock status — e.g. the process crashed mid-send.
 * Resets them back to 'scheduled' so the next tick retries them.
 */
async function recoverStuckEmails(): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE scheduled_emails
     SET status = 'scheduled', updated_at = UTC_TIMESTAMP()
     WHERE status = ?
       AND updated_at < (UTC_TIMESTAMP() - INTERVAL ? MINUTE)`,
    [LOCK_STATUS, STUCK_THRESHOLD_MINUTES]
  );
  if (result.affectedRows > 0) {
    console.warn(
      `[Scheduler] Recovered ${result.affectedRows} stuck '${LOCK_STATUS}' email(s)`
    );
  }
}

let started = false;

export function startEmailScheduler(): void {
  if (started) return;
  started = true;

  cron.schedule("* * * * *", () => {
    processDueEmails().catch((error) =>
      console.error("[Scheduler] Tick error:", error.message)
    );
  });

  cron.schedule("*/5 * * * *", () => {
    recoverStuckEmails().catch((error) =>
      console.error("[Scheduler] Recovery error:", error.message)
    );
  });

  // Catch anything already overdue at boot without waiting for the first tick.
  setTimeout(() => {
    processDueEmails().catch((error) =>
      console.error("[Scheduler] Startup tick error:", error.message)
    );
  }, 5000);

  console.log(
    "📅 Email scheduler started (every 1 min, stuck-job recovery every 5 min)"
  );
}
