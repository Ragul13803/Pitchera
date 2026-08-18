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

// ─────────────────────────────────────────────────────────────────────────────
// Send Job Application Emails
//
// recruiter.name is used for TWO SEPARATE purposes:
//   1. `recruiterName` template var → smart salutation
//      ("Dear John," / "Dear Hiring Team," / "Dear Sir/Madam,")
//   2. Gmail "To:" display name → raw name as typed by user, or null
//      (Gmail shows: "John Smith <john@co.com>" OR just "john@co.com")
// These must NEVER be mixed.
// ─────────────────────────────────────────────────────────────────────────────

export async function sendJobApplicationEmails(params: {
  userId: number;
  jobApplicationId: number;
  recruiters: Array<{ name?: string | null; email: string; position: string }>;
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
    // ── 1. Smart salutation for BODY ({{recruiterName}}) ────────────────────
    const salutation = getSmartSalutation(recruiter.name, recruiter.email);

    const vars: Partial<TemplateVars> = {
      ...params.templateVarsBase,
      position: recruiter.position?.trim() || params.templateVarsBase.position || "",
      recruiterName: salutation,
    };

    const personalizedSubject = replaceTemplateVariables(params.subject, vars);
    const personalizedBody = replaceTemplateVariables(params.body, vars);

    // ── 2. Gmail "To:" display name — raw name, or null if not provided ────
    const toDisplayName = recruiter.name?.trim() || null;

    // For DB logging only — never leave recipient_name blank in the log table
    const logDisplayName = recruiter.name?.trim() || recruiter.email.split("@")[0];

    const [logResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO email_logs 
       (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email, subject, body, status)
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
      const messageId = await sendEmailViaGmail(
        params.userId,
        recruiter.email.toLowerCase(),
        toDisplayName, // ✅ null → Gmail shows just the email, name → "Name <email>"
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
    "UPDATE job_applications SET status = ?, applied_at = NOW(), updated_at = NOW() WHERE id = ?",
    [newStatus, params.jobApplicationId]
  );

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule Email
//
// recipient_name stored here is the RAW name (or email-prefix fallback for
// DB/NOT NULL columns). The scheduler/cron job passes this straight to
// sendEmailViaGmail later — which itself decides whether to show it or not
// based on whether it looks like a real name vs auto-generated fallback.
//
// IMPORTANT: subject/body are already personalized with the salutation BEFORE
// calling this function (done in the controller) — because vars must reflect
// the profile state AT SCHEDULE TIME, not at send time.
// ─────────────────────────────────────────────────────────────────────────────

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
  // Store raw name if provided, otherwise NULL (not a fallback) so the
  // scheduler can correctly decide whether to show a name in "To:" or not.
  const dbRecipientName = params.recipientName?.trim() || null;

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