import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendEmailViaGmail } from "./gmail.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledEmail extends RowDataPacket {
  id: number;
  user_id: number;
  job_application_id: number | null;
  gmail_account_id: number | null;
  recipient_name: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  resume_path: string | null;
  scheduled_at: Date;
  retry_count: number;
  max_retries: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 1 minute
const BATCH_SIZE = 20;           // process up to 20 at a time

let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;

// ─── Core Processing ─────────────────────────────────────────────────────────

/**
 * processScheduledEmails
 *
 * Atomically claims scheduled emails that are due,
 * sends them via Gmail, and updates their status.
 *
 * Concurrency protection:
 *   - UPDATE ... WHERE status = 'scheduled' AND scheduled_at <= NOW()
 *   - Only rows we successfully claim (affectedRows > 0) are processed.
 *   - Status set to 'sending' before any send attempt — prevents double send
 *     even if multiple server instances run simultaneously.
 */
export async function processScheduledEmails(): Promise<void> {
  if (isRunning) return; // prevent overlap on same instance
  isRunning = true;

  try {
    // Step 1: Find due emails that are still 'scheduled'
    // We fetch IDs first, then claim them one by one to prevent race conditions
    const [dueMails] = await pool.query<ScheduledEmail[]>(
      `SELECT id, user_id, job_application_id, gmail_account_id,
              recipient_name, recipient_email, subject, body,
              resume_path, retry_count, max_retries
       FROM scheduled_emails
       WHERE status = 'scheduled'
         AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC
       LIMIT ?`,
      [BATCH_SIZE]
    );

    if (dueMails.length === 0) {
      return;
    }

    console.log(
      `[Scheduler] Found ${dueMails.length} scheduled email(s) to process.`
    );

    for (const email of dueMails) {
      await processSingleEmail(email);
    }
  } catch (err) {
    console.error("[Scheduler] Error in processScheduledEmails:", err);
  } finally {
    isRunning = false;
  }
}

async function processSingleEmail(email: ScheduledEmail): Promise<void> {
  // Step 2: Atomic claim — set status to 'sending' only if still 'scheduled'
  // This prevents double-processing across multiple server instances
  const [claimResult] = await pool.query<ResultSetHeader>(
    `UPDATE scheduled_emails
     SET status = 'sending', updated_at = NOW()
     WHERE id = ? AND status = 'scheduled'`,
    [email.id]
  );

  if (claimResult.affectedRows === 0) {
    // Another instance already claimed this — skip
    console.log(
      `[Scheduler] Email ${email.id} already claimed by another process. Skipping.`
    );
    return;
  }

  console.log(
    `[Scheduler] Processing email ${email.id} → ${email.recipient_email}`
  );

  try {
    // Step 3: Send via existing Gmail service
    const attachments: string[] = email.resume_path
      ? [email.resume_path]
      : [];

    const gmailMessageId = await sendEmailViaGmail(
      email.user_id,
      email.recipient_email,
      email.recipient_name || "",
      email.subject,
      email.body,
      attachments
    );

    // Step 4: Mark sent
    await pool.query(
      `UPDATE scheduled_emails
       SET status = 'sent',
           sent_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [email.id]
    );

    // Step 5: Also create an email_log record for history/dashboard continuity
    await pool.query(
      `INSERT INTO email_logs
         (user_id, job_application_id, gmail_account_id, recipient_name,
          recipient_email, subject, body, status, gmail_message_id, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, NOW())
       ON DUPLICATE KEY UPDATE status = 'sent'`,
      [
        email.user_id,
        email.job_application_id,
        email.gmail_account_id,
        email.recipient_name,
        email.recipient_email,
        email.subject,
        email.body,
        gmailMessageId,
      ]
    );

    // Step 6: Update job_application status if all emails for this app are sent
    if (email.job_application_id) {
      await updateJobApplicationStatus(email.job_application_id);
    }

    console.log(
      `[Scheduler] ✅ Email ${email.id} sent to ${email.recipient_email} (Gmail ID: ${gmailMessageId})`
    );
  } catch (err: any) {
    console.error(
      `[Scheduler] ❌ Email ${email.id} failed:`,
      err.message
    );

    const newRetryCount = email.retry_count + 1;
    const shouldRetry = newRetryCount < email.max_retries;

    if (shouldRetry) {
      // Back off: retry after (retryCount * 5) minutes
      const backoffMinutes = newRetryCount * 5;

      await pool.query(
        `UPDATE scheduled_emails
         SET status = 'scheduled',
             retry_count = ?,
             scheduled_at = DATE_ADD(NOW(), INTERVAL ? MINUTE),
             error_message = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [newRetryCount, backoffMinutes, err.message, email.id]
      );

      console.log(
        `[Scheduler] ♻️  Email ${email.id} scheduled for retry ${newRetryCount}/${email.max_retries} in ${backoffMinutes} min.`
      );
    } else {
      // Max retries exhausted
      await pool.query(
        `UPDATE scheduled_emails
         SET status = 'failed',
             retry_count = ?,
             error_message = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [newRetryCount, err.message, email.id]
      );

      // Update job application to failed if all emails failed
      if (email.job_application_id) {
        await updateJobApplicationStatus(email.job_application_id);
      }

      console.log(
        `[Scheduler] 💀 Email ${email.id} permanently failed after ${newRetryCount} attempts.`
      );
    }
  }
}

/**
 * After a scheduled email is processed (sent or failed),
 * check if all scheduled emails for the same job_application
 * are in terminal state and update the parent record accordingly.
 */
async function updateJobApplicationStatus(
  jobApplicationId: number
): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         SUM(status = 'sent') as sent_count,
         SUM(status = 'failed') as failed_count,
         SUM(status IN ('scheduled','sending')) as pending_count
       FROM scheduled_emails
       WHERE job_application_id = ?`,
      [jobApplicationId]
    );

    const { sent_count, failed_count, pending_count } = rows[0];

    if (Number(pending_count) > 0) return; // still processing

    let newStatus: string;
    if (Number(sent_count) > 0) {
      newStatus = "sent";
    } else {
      newStatus = "failed";
    }

    await pool.query(
      `UPDATE job_applications
       SET status = ?, applied_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [newStatus, jobApplicationId]
    );
  } catch (err) {
    console.error("[Scheduler] Failed to update job application status:", err);
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * startScheduler
 * Call once from app startup.
 * Uses recursive setTimeout (not setInterval) to prevent overlapping runs.
 */
export function startScheduler(): void {
  console.log(
    `[Scheduler] Started — polling every ${POLL_INTERVAL_MS / 1000}s.`
  );

  const tick = async () => {
    await processScheduledEmails();
    // Schedule next tick AFTER current completes
    schedulerTimer = setTimeout(tick, POLL_INTERVAL_MS);
  };

  // Run immediately on startup to catch any overdue emails
  tick();
}

/**
 * stopScheduler
 * Call on graceful shutdown.
 */
export function stopScheduler(): void {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
    console.log("[Scheduler] Stopped.");
  }
}