import dotenv from "dotenv";
dotenv.config();

import pool, { testConnection } from "../database/db";
import { sendEmailViaGmail } from "../services/gmail.service";
import { RowDataPacket } from "mysql2";

interface ScheduledEmail extends RowDataPacket {
  id: number;
  user_id: number;
  job_application_id: number | null;
  gmail_account_id: number;
  recipient_name: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  resume_path: string | null;
  scheduled_at: Date;
  retry_count: number;
  max_retries: number;
}

const SCHEDULER_INTERVAL_MS = 30000; // 30 seconds
const BATCH_SIZE = 10;

async function processPendingEmails(): Promise<void> {
  try {
    const [emails] = await pool.query<ScheduledEmail[]>(
      `SELECT * FROM scheduled_emails
       WHERE status = 'scheduled'
         AND scheduled_at <= NOW()
         AND retry_count < max_retries
       ORDER BY scheduled_at ASC
       LIMIT ?`,
      [BATCH_SIZE]
    );

    if (emails.length === 0) return;

    console.log(`[Scheduler] Processing ${emails.length} scheduled emails`);

    for (const email of emails) {
      // Mark as sending
      await pool.query(
        "UPDATE scheduled_emails SET status = 'sending', updated_at = NOW() WHERE id = ?",
        [email.id]
      );

      try {
        const attachments = email.resume_path ? [email.resume_path] : [];

        const messageId = await sendEmailViaGmail(
          email.user_id,
          email.recipient_email,
          email.recipient_name || "",
          email.subject,
          email.body,
          attachments
        );

        await pool.query(
          `UPDATE scheduled_emails 
           SET status = 'sent', sent_at = NOW(), updated_at = NOW()
           WHERE id = ?`,
          [email.id]
        );

        // Create email log
        await pool.query(
          `INSERT INTO email_logs
           (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email,
            subject, body, status, gmail_message_id, sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, NOW())`,
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

        // Update job application status if applicable
        if (email.job_application_id) {
          await pool.query(
            "UPDATE job_applications SET status = 'sent', applied_at = NOW(), updated_at = NOW() WHERE id = ? AND status = 'scheduled'",
            [email.job_application_id]
          );
        }

        console.log(
          `[Scheduler] ✅ Sent email to ${email.recipient_email} (ID: ${email.id})`
        );
      } catch (error: any) {
        const newRetryCount = email.retry_count + 1;
        const failed = newRetryCount >= email.max_retries;

        await pool.query(
          `UPDATE scheduled_emails 
           SET status = ?, retry_count = ?, error_message = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            failed ? "failed" : "scheduled",
            newRetryCount,
            error.message,
            email.id,
          ]
        );

        console.error(
          `[Scheduler] ❌ Failed to send email to ${email.recipient_email} (ID: ${email.id}): ${error.message}`
        );
      }
    }
  } catch (error: any) {
    console.error("[Scheduler] Error processing emails:", error.message);
  }
}

async function startScheduler(): Promise<void> {
  console.log("🚀 Email scheduler starting...");

  await testConnection();

  console.log(
    `⏰ Scheduler running every ${SCHEDULER_INTERVAL_MS / 1000} seconds`
  );

  // Run immediately on start
  await processPendingEmails();

  setInterval(processPendingEmails, SCHEDULER_INTERVAL_MS);
}

startScheduler().catch((err) => {
  console.error("Scheduler failed to start:", err);
  process.exit(1);
});