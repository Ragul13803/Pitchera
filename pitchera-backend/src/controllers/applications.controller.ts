import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  sendJobApplicationEmails,
  scheduleEmail,
  replaceTemplateVariables,
  getDefaultTemplate,
} from "../services/email.service";
import { getGmailClient } from "../services/gmail.service";
import { sendSuccess, sendError } from "../utils/response";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recruiter {
  name: string;
  email: string;
}

interface SendPayload {
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  jobDescription?: string;
  recruiters: Recruiter[];
  emailBody: string;
  useDefaultTemplate: boolean;
}

interface SchedulePayload extends SendPayload {
  scheduledFor: string; // ISO string e.g. "2025-12-31T09:00:00"
  timezone?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate recruiter array:
 * - At least one
 * - Each has name + valid email
 * - No duplicate emails (case-insensitive)
 */
function validateRecruiters(recruiters: Recruiter[]): string | null {
  if (!recruiters || recruiters.length === 0) {
    return "At least one recruiter is required.";
  }

  const seen = new Set<string>();

  for (let i = 0; i < recruiters.length; i++) {
    const r = recruiters[i];

    if (!r.name || !r.name.trim()) {
      return `Recruiter ${i + 1}: Name is required.`;
    }

    if (!r.email || !r.email.trim()) {
      return `Recruiter ${i + 1}: Email is required.`;
    }

    const emailLower = r.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailLower)) {
      return `Recruiter ${i + 1}: "${r.email}" is not a valid email address.`;
    }

    if (seen.has(emailLower)) {
      return `Duplicate recruiter email: ${emailLower}`;
    }

    seen.add(emailLower);
  }

  return null; // valid
}

/**
 * Build template variable map from user's profile data.
 */
async function buildTemplateVars(userId: number) {
  // Fetch user
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

  // Fetch skills (technical only, comma-joined)
  const [skillRows] = await pool.query<RowDataPacket[]>(
    `SELECT name FROM skills WHERE user_id = ? AND type = 'technical' LIMIT 10`,
    [userId]
  );

  const user = users[0] || {};
  const skills = skillRows.map((s) => s.name).join(", ");

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
    // company and position filled per-request
    company: "",
    position: "",
    recruiterName: "", // filled per-recruiter
  };
}

/**
 * Get primary resume path for user (if any).
 */
async function getPrimaryResumePath(userId: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT file_path FROM resumes WHERE user_id = ? AND is_primary = 1 LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    // Fall back to most recent resume
    const [anyRows] = await pool.query<RowDataPacket[]>(
      `SELECT file_path FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (anyRows.length > 0) {
      return path.resolve(process.cwd(), anyRows[0].file_path);
    }
    return null;
  }

  return path.resolve(process.cwd(), rows[0].file_path);
}

// ─── Send Now ─────────────────────────────────────────────────────────────────

/**
 * POST /api/applications/send
 *
 * 1. Validate input
 * 2. Check Gmail connected
 * 3. Create job_application record
 * 4. Send individual email per recruiter via existing Gmail service
 * 5. Each email logged in email_logs table
 * 6. Return real result counts
 */
export async function sendApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body: SendPayload = req.body;

    // ── 1. Validate ──────────────────────────────────────────────────────────

    if (!body.companyName?.trim()) {
      sendError(res, "Company name is required.", 400);
      return;
    }

    if (!body.jobTitle?.trim()) {
      sendError(res, "Job title is required.", 400);
      return;
    }

    const recruiterError = validateRecruiters(body.recruiters);
    if (recruiterError) {
      sendError(res, recruiterError, 400);
      return;
    }

    if (!body.emailBody?.trim()) {
      sendError(res, "Email body is required.", 400);
      return;
    }

    // ── 2. Check Gmail ───────────────────────────────────────────────────────

    let gmailAccountId: number;
    try {
      const { account } = await getGmailClient(userId);
      gmailAccountId = account.id;
    } catch (err: any) {
      sendError(
        res,
        "Gmail is not connected. Please connect your Gmail account before sending.",
        403
      );
      return;
    }

    // ── 3. Build template vars ───────────────────────────────────────────────

    const templateVarsBase = await buildTemplateVars(userId);
    templateVarsBase.company = body.companyName.trim();
    templateVarsBase.position = body.jobTitle.trim();

    // ── 4. Create job_application record ────────────────────────────────────

    const [appResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_applications
         (user_id, company_name, job_title, job_url, job_description, status)
       VALUES (?, ?, ?, ?, ?, 'sending')`,
      [
        userId,
        body.companyName.trim(),
        body.jobTitle.trim(),
        body.jobUrl?.trim() || null,
        body.jobDescription?.trim() || null,
      ]
    );

    const jobApplicationId = appResult.insertId;

    // ── 5. Get subject ───────────────────────────────────────────────────────

    // Use template subject if user has a default template, otherwise build one
    let subjectTemplate: string;

    const defaultTpl = await getDefaultTemplate(userId);
    if (defaultTpl && body.useDefaultTemplate) {
      subjectTemplate = defaultTpl.subject;
    } else {
      // Custom body — use a sensible subject
      subjectTemplate =
        `Application for {{position}} - {{firstName}} {{lastName}}`;
    }

    // ── 6. Get resume path ───────────────────────────────────────────────────

    const resumePath = await getPrimaryResumePath(userId);

    // ── 7. Send emails ───────────────────────────────────────────────────────

    const result = await sendJobApplicationEmails({
      userId,
      jobApplicationId,
      recruiters: body.recruiters.map((r) => ({
        name: r.name.trim(),
        email: r.email.trim().toLowerCase(),
      })),
      subject: subjectTemplate,
      body: body.emailBody,
      resumePath: resumePath || undefined,
      gmailAccountId,
      templateVarsBase,
    });

    // ── 8. Return real result ────────────────────────────────────────────────

    const total = body.recruiters.length;
    let message: string;

    if (result.failed === 0) {
      message =
        total === 1
          ? "Email sent successfully."
          : `${result.sent} email${result.sent > 1 ? "s" : ""} sent successfully.`;
    } else if (result.sent === 0) {
      message = `All ${total} email${total > 1 ? "s" : ""} failed to send.`;
    } else {
      message = `${result.sent} email${result.sent > 1 ? "s" : ""} sent successfully, ${result.failed} failed.`;
    }

    sendSuccess(
      res,
      {
        sent: result.sent,
        failed: result.failed,
        total,
        errors: result.errors,
        jobApplicationId,
      },
      message
    );
  } catch (error) {
    next(error);
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

/**
 * POST /api/applications/schedule
 *
 * 1. Validate input + scheduled time
 * 2. Check Gmail connected
 * 3. Create job_application record (status = 'scheduled')
 * 4. Insert one scheduled_emails record per recruiter
 * 5. Return confirmation
 */
export async function scheduleApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body: SchedulePayload = req.body;

    // ── 1. Validate ──────────────────────────────────────────────────────────

    if (!body.companyName?.trim()) {
      sendError(res, "Company name is required.", 400);
      return;
    }

    if (!body.jobTitle?.trim()) {
      sendError(res, "Job title is required.", 400);
      return;
    }

    const recruiterError = validateRecruiters(body.recruiters);
    if (recruiterError) {
      sendError(res, recruiterError, 400);
      return;
    }

    if (!body.emailBody?.trim()) {
      sendError(res, "Email body is required.", 400);
      return;
    }

    if (!body.scheduledFor) {
      sendError(res, "Scheduled date/time is required.", 400);
      return;
    }

    const scheduledAt = new Date(body.scheduledFor);

    if (isNaN(scheduledAt.getTime())) {
      sendError(res, "Invalid scheduled date/time format.", 400);
      return;
    }

    // Must be in the future (with 1 min buffer)
    if (scheduledAt.getTime() <= Date.now() + 60_000) {
      sendError(
        res,
        "Scheduled time must be at least 1 minute in the future.",
        400
      );
      return;
    }

    // ── 2. Check Gmail ───────────────────────────────────────────────────────

    let gmailAccountId: number;
    try {
      const { account } = await getGmailClient(userId);
      gmailAccountId = account.id;
    } catch {
      sendError(
        res,
        "Gmail is not connected. Please connect your Gmail account before scheduling.",
        403
      );
      return;
    }

    // ── 3. Build template vars ───────────────────────────────────────────────

    const templateVarsBase = await buildTemplateVars(userId);
    templateVarsBase.company = body.companyName.trim();
    templateVarsBase.position = body.jobTitle.trim();

    // ── 4. Subject template ──────────────────────────────────────────────────

    let subjectTemplate: string;
    const defaultTpl = await getDefaultTemplate(userId);

    if (defaultTpl && body.useDefaultTemplate) {
      subjectTemplate = defaultTpl.subject;
    } else {
      subjectTemplate =
        `Application for {{position}} - {{firstName}} {{lastName}}`;
    }

    // ── 5. Resume path ───────────────────────────────────────────────────────

    const resumePath = await getPrimaryResumePath(userId);

    // ── 6. Create job_application record ────────────────────────────────────

    const [appResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_applications
         (user_id, company_name, job_title, job_url, job_description, status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [
        userId,
        body.companyName.trim(),
        body.jobTitle.trim(),
        body.jobUrl?.trim() || null,
        body.jobDescription?.trim() || null,
      ]
    );

    const jobApplicationId = appResult.insertId;

    // ── 7. Insert one scheduled_emails row per recruiter ─────────────────────

    const scheduledIds: number[] = [];

    for (const recruiter of body.recruiters) {
      const personalizedSubject = replaceTemplateVariables(subjectTemplate, {
        ...templateVarsBase,
        recruiterName: recruiter.name.trim(),
      });

      const personalizedBody = replaceTemplateVariables(body.emailBody, {
        ...templateVarsBase,
        recruiterName: recruiter.name.trim(),
      });

      const id = await scheduleEmail({
        userId,
        jobApplicationId,
        gmailAccountId,
        recipientName: recruiter.name.trim(),
        recipientEmail: recruiter.email.trim().toLowerCase(),
        subject: personalizedSubject,
        body: personalizedBody,
        resumePath: resumePath || undefined,
        scheduledAt,
      });

      scheduledIds.push(id);
    }

    const total = body.recruiters.length;
    const message =
      total === 1
        ? "Email scheduled successfully."
        : `${total} emails scheduled successfully.`;

    sendSuccess(
      res,
      {
        scheduled: total,
        scheduledAt: scheduledAt.toISOString(),
        scheduledIds,
        jobApplicationId,
      },
      message
    );
  } catch (error) {
    next(error);
  }
}