import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../database/db";
import { sendEmailViaGmail } from "./gmail.service";

interface EmailTemplate extends RowDataPacket {
  id: number;
  user_id: number;
  name: string;
  subject: string;
  body: string;
  is_default: number;
}

interface TemplateVars {
  firstName: string;
  lastName: string;
  recruiterName: string;
  company: string;
  position: string;
  experience: string;
  skills: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export function replaceTemplateVariables(
  template: string,
  vars: Partial<TemplateVars>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value || "");
  }
  return result;
}

export async function getDefaultTemplate(
  userId: number
): Promise<EmailTemplate | null> {
  const [templates] = await pool.query<EmailTemplate[]>(
    "SELECT * FROM email_templates WHERE user_id = ? AND is_default = 1",
    [userId]
  );
  return templates[0] || null;
}

export async function getUserTemplates(userId: number): Promise<EmailTemplate[]> {
  const [templates] = await pool.query<EmailTemplate[]>(
    "SELECT * FROM email_templates WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
    [userId]
  );
  return templates;
}

export async function sendJobApplicationEmails(params: {
  userId: number;
  jobApplicationId: number;
  recruiters: Array<{ name: string; email: string }>;
  subject: string;
  body: string;
  resumePath?: string;
  additionalAttachments?: string[];
  gmailAccountId: number;
  templateVarsBase: Partial<TemplateVars>;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { client: gmailClient, account } = await import("./gmail.service").then(
    (m) => m.getGmailClient(params.userId)
  );

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  const attachments = [
    ...(params.resumePath ? [params.resumePath] : []),
    ...(params.additionalAttachments || []),
  ];

  for (const recruiter of params.recruiters) {
    const personalizedSubject = replaceTemplateVariables(params.subject, {
      ...params.templateVarsBase,
      recruiterName: recruiter.name,
    });

    const personalizedBody = replaceTemplateVariables(params.body, {
      ...params.templateVarsBase,
      recruiterName: recruiter.name,
    });

    // Create email log
    const [logResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO email_logs 
       (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email, subject, body, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sending')`,
      [
        params.userId,
        params.jobApplicationId,
        params.gmailAccountId,
        recruiter.name,
        recruiter.email.toLowerCase(),
        personalizedSubject,
        personalizedBody,
      ]
    );

    const emailLogId = logResult.insertId;

    try {
      const messageId = await sendEmailViaGmail(
        params.userId,
        recruiter.email.toLowerCase(),
        recruiter.name,
        personalizedSubject,
        personalizedBody,
        attachments
      );

      await pool.query(
        `UPDATE email_logs 
         SET status = 'sent', gmail_message_id = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [messageId, emailLogId]
      );

      results.sent++;
    } catch (error: any) {
      await pool.query(
        `UPDATE email_logs 
         SET status = 'failed', error_message = ?, updated_at = NOW()
         WHERE id = ?`,
        [error.message, emailLogId]
      );

      results.failed++;
      results.errors.push(`${recruiter.email}: ${error.message}`);
    }
  }

  // Update job application status
  const newStatus = results.sent > 0 ? "sent" : "failed";
  await pool.query(
    "UPDATE job_applications SET status = ?, applied_at = NOW(), updated_at = NOW() WHERE id = ?",
    [newStatus, params.jobApplicationId]
  );

  return results;
}

export async function scheduleEmail(params: {
  userId: number;
  jobApplicationId: number;
  gmailAccountId: number;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  resumePath?: string;
  scheduledAt: Date;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO scheduled_emails
     (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email,
      subject, body, resume_path, scheduled_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
    [
      params.userId,
      params.jobApplicationId,
      params.gmailAccountId,
      params.recipientName,
      params.recipientEmail.toLowerCase(),
      params.subject,
      params.body,
      params.resumePath || null,
      params.scheduledAt,
    ]
  );
  return result.insertId;
}