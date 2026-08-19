// backend/src/controllers/applications.controller.ts

import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  sendJobApplicationEmails,
  scheduleEmail,
  replaceTemplateVariables,
} from "../services/email.service";
import { getGmailClient, createDraftViaGmail } from "../services/gmail.service";
import { sendSuccess, sendError } from "../utils/response";
import path from "path";
import { getSmartSalutation } from "../utils/email";
import { processDueEmails } from "../jobs/emailScheduler";

interface RecruiterInput {
  name?: string | null;
  email: string;
  position: string;
}

interface SendPayload {
  companyName: string;
  applicationId?: number;
  recruiters: RecruiterInput[];
  emailBody: string;
  emailSubject: string;
  useDefaultTemplate: boolean;
}

interface SchedulePayload extends SendPayload {
  scheduledFor: string;
  timezone?: string;
}

function validateRecruiters(recruiters: RecruiterInput[]): string | null {
  if (!recruiters || recruiters.length === 0) {
    return "At least one recruiter is required.";
  }
  const seen = new Set<string>();
  for (let i = 0; i < recruiters.length; i++) {
    const r = recruiters[i];
    if (!r.email?.trim()) return `Recruiter ${i + 1}: Email is required.`;
    const emailLower = r.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return `Recruiter ${i + 1}: "${r.email}" is not a valid email address.`;
    }
    if (seen.has(emailLower)) return `Duplicate recruiter email: ${emailLower}`;
    seen.add(emailLower);
    if (!r.position?.trim()) return `Recruiter ${i + 1}: Position is required.`;
  }
  return null;
}

/** Resolves an existing job_applications row owned by this user, if an id was passed in. */
async function resolveExistingApplication(
  userId: number,
  applicationId: number | undefined
): Promise<number | null> {
  if (!applicationId) return null;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM job_applications WHERE id = ? AND user_id = ?`,
    [applicationId, userId]
  );
  return rows.length > 0 ? rows[0].id : null;
}

async function buildTemplateVars(userId: number, companyName: string) {
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT u.first_name, u.last_name, u.email,
            p.phone, p.total_experience,
            sl.linkedin, sl.github, sl.portfolio
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN social_links sl ON sl.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  const [skillRows] = await pool.query<RowDataPacket[]>(
    `SELECT name FROM skills WHERE user_id = ? AND type = 'technical' LIMIT 10`,
    [userId]
  );
  const user = users[0] || {};
  const skills = skillRows.map((s: RowDataPacket) => s.name).join(", ");
  return {
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    experience: user.total_experience || "",
    skills,
    linkedin: user.linkedin || "",
    github: user.github || "",
    portfolio: user.portfolio || "",
    company: companyName,
    position: "",
    recruiterName: "",
  };
}

async function getPrimaryResumePath(userId: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT file_path FROM resumes WHERE user_id = ? AND is_primary = 1 LIMIT 1`,
    [userId]
  );
  if (rows.length > 0) return path.resolve(process.cwd(), rows[0].file_path);

  const [anyRows] = await pool.query<RowDataPacket[]>(
    `SELECT file_path FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (anyRows.length > 0) return path.resolve(process.cwd(), anyRows[0].file_path);
  return null;
}

// ─── Send Now ─────────────────────────────────────────────────────────────────

export async function sendApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body: SendPayload = req.body;

    const companyName = body.companyName?.trim();
    if (!companyName) { sendError(res, "Company name is required.", 400); return; }

    const recruiterError = validateRecruiters(body.recruiters);
    if (recruiterError) { sendError(res, recruiterError, 400); return; }

    if (!body.emailBody?.trim()) { sendError(res, "Email body is required.", 400); return; }
    if (!body.emailSubject?.trim()) { sendError(res, "Email subject is required.", 400); return; }

    let gmailAccountId: number;
    try {
      const { account } = await getGmailClient(userId);
      gmailAccountId = account.id;
    } catch {
      sendError(res, "Gmail is not connected. Please connect Gmail before sending.", 403);
      return;
    }

    const templateVarsBase = await buildTemplateVars(userId, companyName);
    const resumePath = await getPrimaryResumePath(userId);
    const firstPosition = body.recruiters[0].position.trim();

    const existingApplicationId = await resolveExistingApplication(userId, body.applicationId);
    let jobApplicationId: number;
    if (existingApplicationId) {
      jobApplicationId = existingApplicationId;
      await pool.query(
        `UPDATE job_applications SET company_name = ?, job_title = ?, updated_at = NOW() WHERE id = ?`,
        [companyName, firstPosition, jobApplicationId]
      );
    } else {
      const [appResult] = await pool.query<ResultSetHeader>(
        `INSERT INTO job_applications (user_id, company_name, job_title, status)
         VALUES (?, ?, ?, 'applied')`,
        [userId, companyName, firstPosition]
      );
      jobApplicationId = appResult.insertId;
    }

    const results = await sendJobApplicationEmails({
      userId,
      jobApplicationId,
      gmailAccountId,
      recruiters: body.recruiters.map((r) => ({
        name: r.name?.trim() || null,       // null if empty — only for salutation
        email: r.email.trim().toLowerCase(),
        position: r.position.trim(),
      })),
      subject: body.emailSubject,
      body: body.emailBody,
      resumePath: resumePath || undefined,
      templateVarsBase,
    });

    if (results.failed === 0) {
      sendSuccess(
        res,
        { sent: results.sent, failed: 0, errors: [], jobApplicationId },
        results.sent === 1 ? "Email sent successfully." : `${results.sent} emails sent successfully.`
      );
    } else if (results.sent === 0) {
      sendError(res, `All emails failed.\n${results.errors.join("\n")}`, 500);
    } else {
      sendSuccess(
        res,
        { sent: results.sent, failed: results.failed, errors: results.errors, jobApplicationId },
        `${results.sent} sent, ${results.failed} failed.`
      );
    }
  } catch (error) {
    next(error);
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body: SchedulePayload = req.body;

    const companyName = body.companyName?.trim();
    if (!companyName) { sendError(res, "Company name is required.", 400); return; }

    const recruiterError = validateRecruiters(body.recruiters);
    if (recruiterError) { sendError(res, recruiterError, 400); return; }

    if (!body.emailBody?.trim()) { sendError(res, "Email body is required.", 400); return; }
    if (!body.emailSubject?.trim()) { sendError(res, "Email subject is required.", 400); return; }
    if (!body.scheduledFor) { sendError(res, "Scheduled date/time is required.", 400); return; }

    const scheduledAt = new Date(body.scheduledFor);
    if (isNaN(scheduledAt.getTime())) { sendError(res, "Invalid scheduled date/time.", 400); return; }
    if (scheduledAt.getTime() <= Date.now() + 60_000) {
      sendError(res, "Scheduled time must be at least 1 minute in the future.", 400);
      return;
    }

    let gmailAccountId: number;
    try {
      const { account } = await getGmailClient(userId);
      gmailAccountId = account.id;
    } catch {
      sendError(res, "Gmail is not connected. Please connect Gmail before scheduling.", 403);
      return;
    }

    const templateVarsBase = await buildTemplateVars(userId, companyName);
    const resumePath = await getPrimaryResumePath(userId);
    const firstPosition = body.recruiters[0].position.trim();

    const existingApplicationId = await resolveExistingApplication(userId, body.applicationId);
    let jobApplicationId: number;
    if (existingApplicationId) {
      jobApplicationId = existingApplicationId;
      await pool.query(
        `UPDATE job_applications SET company_name = ?, job_title = ?, status = 'scheduled', updated_at = NOW() WHERE id = ?`,
        [companyName, firstPosition, jobApplicationId]
      );
    } else {
      const [appResult] = await pool.query<ResultSetHeader>(
        `INSERT INTO job_applications (user_id, company_name, job_title, status)
         VALUES (?, ?, ?, 'scheduled')`,
        [userId, companyName, firstPosition]
      );
      jobApplicationId = appResult.insertId;
    }

    const scheduledIds: number[] = [];

    for (const recruiter of body.recruiters) {
      // Salutation resolved NOW — snapshot of current state
      const salutation = getSmartSalutation(recruiter.name, recruiter.email);

      const vars = {
        ...templateVarsBase,
        position: recruiter.position.trim(),
        recruiterName: salutation, // → "Dear John," / "Dear Hiring Team," etc.
      };

      const personalizedSubject = replaceTemplateVariables(body.emailSubject, vars);
      const personalizedBody = replaceTemplateVariables(body.emailBody, vars);

      const id = await scheduleEmail({
        userId,
        jobApplicationId,
        gmailAccountId,
        recipientName: recruiter.name?.trim() || null, // for DB records only
        recipientEmail: recruiter.email.trim().toLowerCase(),
        subject: personalizedSubject,
        body: personalizedBody,
        resumePath: resumePath || undefined,
        scheduledAt,
      });

      // Best-effort: create a Gmail draft so the user sees the email under
      // Gmail > Drafts immediately. Never fails the schedule request itself —
      // the cron worker still sends from the stored subject/body either way.
      try {
        const draftId = await createDraftViaGmail(
          userId,
          recruiter.email.trim().toLowerCase(),
          personalizedSubject,
          personalizedBody,
          resumePath ? [resumePath] : []
        );
        await pool.query("UPDATE scheduled_emails SET gmail_draft_id = ? WHERE id = ?", [
          draftId,
          id,
        ]);
      } catch (draftError: any) {
        console.error(
          `[Schedule] Failed to create Gmail draft for scheduled email #${id}:`,
          draftError.message
        );
      }

      scheduledIds.push(id);
    }

    const total = body.recruiters.length;
    sendSuccess(
      res,
      { scheduled: total, scheduledAt: scheduledAt.toISOString(), scheduledIds, jobApplicationId },
      total === 1 ? "Email scheduled successfully." : `${total} emails scheduled successfully.`
    );
  } catch (error) {
    next(error);
  }
}

// ─── Manual scheduler trigger ──────────────────────────────────────────────
// Lets an external cron (e.g. on serverless hosts where the in-process
// setInterval/node-cron loop won't survive between invocations) kick the
// scheduled-email queue on demand.

export async function processScheduledEmails(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await processDueEmails();
    sendSuccess(res, result, "Scheduled email queue processed.");
  } catch (error) {
    next(error);
  }
}

interface RecipientRow extends RowDataPacket {
  job_application_id: number;
  recipient_name: string | null;
  recipient_email: string;
  status: string;
  sent_at: Date | null;
  scheduled_at: Date | null;
  error_message: string | null;
  created_at: Date;
}

// getAllApplications — returns each application plus a rollup of its
// recipients/status details so the Applications list can render everything
// (who it went to, when it's due, why it failed) from one call.
export async function getAllApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;

    const allowedStatuses = [
      "draft",
      "scheduled",
      "sent",
      "failed",
      "interview",
      "rejected",
      "selected",
      "offer",
    ];

    if (status && !allowedStatuses.includes(status)) {
      sendError(res, "Invalid application status.", 400);
      return;
    }

    let query = `
      SELECT id, company_name, job_title, job_url, status, applied_at, created_at, updated_at
      FROM job_applications
      WHERE user_id = ?
    `;
    const params: any[] = [userId];
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    query += ` ORDER BY created_at DESC`;

    const [applications] = await pool.query<RowDataPacket[]>(query, params);

    const [recipientRows] = await pool.query<RecipientRow[]>(
      `SELECT job_application_id, recipient_name, recipient_email, status,
              sent_at, NULL AS scheduled_at, error_message, created_at
       FROM email_logs
       WHERE user_id = ? AND job_application_id IS NOT NULL
       UNION ALL
       SELECT job_application_id, recipient_name, recipient_email, status,
              sent_at, scheduled_at, error_message, created_at
       FROM scheduled_emails
       WHERE user_id = ? AND job_application_id IS NOT NULL`,
      [userId, userId]
    );

    const recipientsByApp = new Map<number, RecipientRow[]>();
    for (const row of recipientRows) {
      const list = recipientsByApp.get(row.job_application_id) ?? [];
      list.push(row);
      recipientsByApp.set(row.job_application_id, list);
    }

    const enriched = applications.map((app) => {
      const recipients = (recipientsByApp.get(app.id) ?? []).sort(
        (a, b) => a.created_at.getTime() - b.created_at.getTime()
      );

      const nextScheduledAt = recipients
        .filter((r) => r.status === "scheduled" && r.scheduled_at)
        .map((r) => r.scheduled_at as Date)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      const lastSentAt = recipients
        .filter((r) => r.status === "sent" && r.sent_at)
        .map((r) => r.sent_at as Date)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const lastError = [...recipients]
        .reverse()
        .find((r) => r.status === "failed" && r.error_message)?.error_message;

      return {
        id: app.id,
        companyName: app.company_name,
        jobTitle: app.job_title,
        jobUrl: app.job_url,
        status: app.status,
        appliedAt: app.applied_at,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
        recipients: recipients.map((r) => ({
          name: r.recipient_name,
          email: r.recipient_email,
          status: r.status,
        })),
        recipientCount: recipients.length,
        scheduledAt: nextScheduledAt ?? null,
        sentAt: lastSentAt ?? null,
        errorMessage: lastError ?? null,
      };
    });

    sendSuccess(
      res,
      enriched,
      status
        ? `Applications with status '${status}' fetched successfully.`
        : "All applications fetched successfully."
    );
  } catch (error) {
    next(error);
  }
}