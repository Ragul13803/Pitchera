// backend/src/services/email.service.ts

import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../database/db";
import { sendEmailViaGmail } from "./gmail.service";
import { getSmartSalutation } from "../utils/email";

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

export async function createTemplate(params: {
  userId: number;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}): Promise<EmailTemplate> {
  if (params.isDefault) {
    await pool.query("UPDATE email_templates SET is_default = 0 WHERE user_id = ?", [
      params.userId,
    ]);
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO email_templates (user_id, name, subject, body, is_default)
     VALUES (?, ?, ?, ?, ?)`,
    [params.userId, params.name, params.subject, params.body, params.isDefault ? 1 : 0]
  );

  const [rows] = await pool.query<EmailTemplate[]>(
    "SELECT * FROM email_templates WHERE id = ?",
    [result.insertId]
  );
  return rows[0];
}

export async function updateTemplate(params: {
  userId: number;
  templateId: number;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}): Promise<EmailTemplate | null> {
  const [existing] = await pool.query<EmailTemplate[]>(
    "SELECT id FROM email_templates WHERE id = ? AND user_id = ?",
    [params.templateId, params.userId]
  );
  if (existing.length === 0) return null;

  if (params.isDefault) {
    await pool.query("UPDATE email_templates SET is_default = 0 WHERE user_id = ?", [
      params.userId,
    ]);
  }

  await pool.query(
    `UPDATE email_templates SET name = ?, subject = ?, body = ?, is_default = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [
      params.name,
      params.subject,
      params.body,
      params.isDefault ? 1 : 0,
      params.templateId,
      params.userId,
    ]
  );

  const [rows] = await pool.query<EmailTemplate[]>(
    "SELECT * FROM email_templates WHERE id = ?",
    [params.templateId]
  );
  return rows[0];
}

export async function deleteTemplate(userId: number, templateId: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM email_templates WHERE id = ? AND user_id = ?",
    [templateId, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Send job application emails.
 *
 * recruiter.name → ONLY used for smart salutation in email body.
 *                  NEVER passed to Gmail "To:" header.
 * To: header     → always just the raw email address.
 */
export async function sendJobApplicationEmails(params: {
  userId: number;
  jobApplicationId: number;
  recruiters: Array<{
    name?: string | null;  // optional — only for body salutation
    email: string;
    position: string;
  }>;
  subject: string;
  body: string;
  resumePath?: string;
  additionalAttachments?: string[];
  gmailAccountId: number;
  templateVarsBase: Partial<TemplateVars>;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  const attachments = [
    ...(params.resumePath ? [params.resumePath] : []),
    ...(params.additionalAttachments || []),
  ];

  for (const recruiter of params.recruiters) {
    // ── Salutation for body ONLY ─────────────────────────────────────────
    // Name field value → first name OR smart fallback based on email
    const salutation = getSmartSalutation(recruiter.name, recruiter.email);

    const vars: Partial<TemplateVars> = {
      ...params.templateVarsBase,
      position: recruiter.position?.trim() || params.templateVarsBase.position || "",
      recruiterName: salutation, // → replaces {{recruiterName}} in body
    };

    const personalizedSubject = replaceTemplateVariables(params.subject, vars);
    const personalizedBody = replaceTemplateVariables(params.body, vars);

    // ── DB log display name — just for our internal records ─────────────
    const logDisplayName =
      recruiter.name?.trim() || recruiter.email.split("@")[0];

    const [logResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO email_logs 
       (user_id, job_application_id, gmail_account_id, recipient_name, 
        recipient_email, subject, body, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sending')`,
      [
        params.userId,
        params.jobApplicationId,
        params.gmailAccountId,
        logDisplayName,
        recruiter.email.toLowerCase(),
        personalizedSubject,
        personalizedBody,
      ]
    );

    const emailLogId = logResult.insertId;

    try {
      // ✅ No toName passed — To: is always raw email only
      const messageId = await sendEmailViaGmail(
        params.userId,
        recruiter.email.toLowerCase(),
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

  const newStatus = results.sent > 0 ? "sent" : "failed";
  await pool.query(
    `UPDATE job_applications 
     SET status = ?, applied_at = NOW(), updated_at = NOW() 
     WHERE id = ?`,
    [newStatus, params.jobApplicationId]
  );

  return results;
}

/**
 * Schedule email for later sending.
 * Subject/body already have salutation baked in (resolved at schedule time).
 * recipient_name stored for internal records only — NOT used in To: header.
 */
export async function scheduleEmail(params: {
  userId: number;
  jobApplicationId: number;
  gmailAccountId: number;
  recipientName?: string | null;
  recipientEmail: string;
  subject: string;
  body: string;
  resumePath?: string;
  scheduledAt: Date;
}): Promise<number> {
  const dbRecipientName =
    params.recipientName?.trim() || params.recipientEmail.split("@")[0];

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO scheduled_emails
     (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email,
      subject, body, resume_path, scheduled_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
    [
      params.userId,
      params.jobApplicationId,
      params.gmailAccountId,
      dbRecipientName,
      params.recipientEmail.toLowerCase(),
      params.subject,
      params.body,
      params.resumePath || null,
      params.scheduledAt,
    ]
  );
  return result.insertId;
}