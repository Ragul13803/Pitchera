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
import { getGmailClient } from "../services/gmail.service";
import { sendSuccess, sendError } from "../utils/response";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecruiterInput {
  name?: string | null;
  email: string;
  position: string;
}

interface SendPayload {
  recruiters: RecruiterInput[];
  emailBody: string;
  emailSubject: string;
  useDefaultTemplate: boolean;
}

interface SchedulePayload extends SendPayload {
  scheduledFor: string;
  timezone?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate recruiter array from new frontend shape.
 * Name is optional. Email + position are required.
 */
function validateRecruiters(recruiters: RecruiterInput[]): string | null {
  if (!recruiters || recruiters.length === 0) {
    return "At least one recruiter is required.";
  }

  const seen = new Set<string>();

  for (let i = 0; i < recruiters.length; i++) {
    const r = recruiters[i];

    if (!r.email?.trim()) {
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

    if (!r.position?.trim()) {
      return `Recruiter ${i + 1}: Position is required.`;
    }
  }

  return null;
}

/**
 * Build template variable map from user profile.
 */
async function buildTemplateVars(userId: number) {
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
    company: "",
    position: "",
    recruiterName: "",
  };
}

/**
 * Get primary resume absolute path (or most recent).
 */
async function getPrimaryResumePath(userId: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT file_path FROM resumes
     WHERE user_id = ? AND is_primary = 1 LIMIT 1`,
    [userId]
  );

  if (rows.length > 0) {
    return path.resolve(process.cwd(), rows[0].file_path);
  }

  const [anyRows] = await pool.query<RowDataPacket[]>(
    `SELECT file_path FROM resumes
     WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (anyRows.length > 0) {
    return path.resolve(process.cwd(), anyRows[0].file_path);
  }

  return null;
}

// ─── Send Now ─────────────────────────────────────────────────────────────────

/**
 * POST /api/applications/send
 *
 * Frontend sends:
 * {
 *   recruiters: [{ name?, email, position }],
 *   emailBody: string,        ← template body from frontend (with {{vars}})
 *   emailSubject: string,     ← template subject from frontend (with {{vars}})
 *   useDefaultTemplate: bool
 * }
 *
 * Backend:
 * 1. Validates input
 * 2. Checks Gmail connected
 * 3. Builds profile-based template vars
 * 4. Creates ONE job_application row (grouped by first position)
 * 5. Sends individual personalized email per recruiter
 * 6. Each email logged in email_logs
 * 7. Returns real sent/failed counts
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

    const recruiterError = validateRecruiters(body.recruiters);
    if (recruiterError) {
      sendError(res, recruiterError, 400);
      return;
    }

    if (!body.emailBody?.trim()) {
      sendError(res, "Email body is required.", 400);
      return;
    }

    if (!body.emailSubject?.trim()) {
      sendError(res, "Email subject is required.", 400);
      return;
    }

    // ── 2. Check Gmail connected ─────────────────────────────────────────────

    let gmailAccountId: number;
    try {
      const { account } = await getGmailClient(userId);
      gmailAccountId = account.id;
    } catch {
      sendError(
        res,
        "Gmail is not connected. Please connect your Gmail account before sending.",
        403
      );
      return;
    }

    // ── 3. Build template vars from user profile ─────────────────────────────

    const templateVarsBase = await buildTemplateVars(userId);

    // ── 4. Get resume path ───────────────────────────────────────────────────

    const resumePath = await getPrimaryResumePath(userId);

    // ── 5. Create job_application record ─────────────────────────────────────
    //
    // Since the new form is recruiter-centric (no single company/job title),
    // we use the first recruiter's position as the job_title and
    // "Direct Outreach" as company_name for the application record.
    // This keeps the existing schema intact.

    const firstPosition = body.recruiters[0].position.trim();

    const [appResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_applications
         (user_id, company_name, job_title, status)
       VALUES (?, ?, ?, 'draft')`,
      [userId, "Direct Outreach", firstPosition]
    );

    const jobApplicationId = appResult.insertId;

    // ── 6. Send one personalized email per recruiter ─────────────────────────
    //
    // For each recruiter we:
    //   a) Set position = recruiter's specific position
    //   b) Set recruiterName = recruiter's name (or email prefix if no name)
    //   c) Replace all {{vars}} in both subject and body

    const recruitersForSend = body.recruiters.map((r) => ({
      // name passed to sendJobApplicationEmails — used for {{recruiterName}}
      name: r.name?.trim() || r.email.trim().split("@")[0],
      email: r.email.trim().toLowerCase(),
      // carry position for per-recruiter template replacement
      position: r.position.trim(),
    }));

    // We call the existing sendJobApplicationEmails but we need per-recruiter
    // position substitution. We do it by pre-building the body per recruiter
    // and passing them individually.

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const recruiter of recruitersForSend) {
      // Build vars specific to this recruiter
      const vars = {
        ...templateVarsBase,
        position: recruiter.position,
        company: "Direct Outreach",
        recruiterName: recruiter.name,
      };

      const personalizedSubject = replaceTemplateVariables(
        body.emailSubject,
        vars
      );

      const personalizedBody = replaceTemplateVariables(body.emailBody, vars);

      // Use sendJobApplicationEmails with a single recruiter
      // so we get proper email_logs entry per recruiter
      const singleResult = await sendJobApplicationEmails({
        userId,
        jobApplicationId,
        recruiters: [{ name: recruiter.name, email: recruiter.email }],
        subject: personalizedSubject,
        body: personalizedBody,
        resumePath: resumePath || undefined,
        gmailAccountId,
        // vars already substituted — pass empty to avoid double-replace
        templateVarsBase: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          experience: "",
          skills: "",
          linkedin: "",
          github: "",
          portfolio: "",
          company: "",
          position: "",
          recruiterName: "",
        },
      });

      results.sent += singleResult.sent;
      results.failed += singleResult.failed;
      results.errors.push(...singleResult.errors);
    }

    // ── 7. Update job_application final status ───────────────────────────────

    const finalStatus = results.sent > 0 ? "sent" : "failed";
    await pool.query(
      `UPDATE job_applications
       SET status = ?, applied_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [finalStatus, jobApplicationId]
    );

    // ── 8. Respond with real counts ──────────────────────────────────────────

    const total = body.recruiters.length;
    let message: string;

    if (results.failed === 0) {
      message =
        total === 1
          ? "Email sent successfully."
          : `${results.sent} emails sent successfully.`;
    } else if (results.sent === 0) {
      message = `All ${total} emails failed to send.`;
    } else {
      message = `${results.sent} sent, ${results.failed} failed.`;
    }

    sendSuccess(
      res,
      {
        sent: results.sent,
        failed: results.failed,
        total,
        errors: results.errors,
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
 * Same payload as send + scheduledFor + timezone.
 * Inserts one scheduled_emails row per recruiter.
 * Template vars are resolved NOW and stored (so they reflect current profile).
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

    const recruiterError = validateRecruiters(body.recruiters);
    if (recruiterError) {
      sendError(res, recruiterError, 400);
      return;
    }

    if (!body.emailBody?.trim()) {
      sendError(res, "Email body is required.", 400);
      return;
    }

    if (!body.emailSubject?.trim()) {
      sendError(res, "Email subject is required.", 400);
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

    if (scheduledAt.getTime() <= Date.now() + 60_000) {
      sendError(
        res,
        "Scheduled time must be at least 1 minute in the future.",
        400
      );
      return;
    }

    // ── 2. Check Gmail connected ─────────────────────────────────────────────

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

    // ── 4. Resume path ───────────────────────────────────────────────────────

    const resumePath = await getPrimaryResumePath(userId);

    // ── 5. Create job_application record ─────────────────────────────────────

    const firstPosition = body.recruiters[0].position.trim();

    const [appResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_applications
         (user_id, company_name, job_title, status)
       VALUES (?, ?, ?, 'scheduled')`,
      [userId, "Direct Outreach", firstPosition]
    );

    const jobApplicationId = appResult.insertId;

    // ── 6. Insert one scheduled_emails row per recruiter ─────────────────────

    const scheduledIds: number[] = [];

    for (const recruiter of body.recruiters) {
      const recruiterName =
        recruiter.name?.trim() ||
        recruiter.email.trim().split("@")[0];

      const vars = {
        ...templateVarsBase,
        position: recruiter.position.trim(),
        company: "Direct Outreach",
        recruiterName,
      };

      // Resolve template vars NOW — stored in DB ready to send at scheduled time
      const personalizedSubject = replaceTemplateVariables(
        body.emailSubject,
        vars
      );

      const personalizedBody = replaceTemplateVariables(body.emailBody, vars);

      const id = await scheduleEmail({
        userId,
        jobApplicationId,
        gmailAccountId,
        recipientName: recruiterName,
        recipientEmail: recruiter.email.trim().toLowerCase(),
        subject: personalizedSubject,
        body: personalizedBody,
        resumePath: resumePath || undefined,
        scheduledAt,
      });

      scheduledIds.push(id);
    }

    // ── 7. Respond ───────────────────────────────────────────────────────────

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