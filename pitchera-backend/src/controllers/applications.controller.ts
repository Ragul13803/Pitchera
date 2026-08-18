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
import { getSmartSalutation } from "../utils/email";

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
    company: "Direct Outreach",
    position: "",
    recruiterName: "",
  };
}

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

export async function sendApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body: SendPayload = req.body;

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

    const templateVarsBase = await buildTemplateVars(userId);
    const resumePath = await getPrimaryResumePath(userId);
    const firstPosition = body.recruiters[0].position.trim();

    const [appResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_applications
         (user_id, company_name, job_title, status)
       VALUES (?, ?, ?, 'draft')`,
      [userId, "Direct Outreach", firstPosition]
    );

    const jobApplicationId = appResult.insertId;

    // ── Service handles salutation + To: header logic internally ────────────
    const results = await sendJobApplicationEmails({
      userId,
      jobApplicationId,
      gmailAccountId,
      recruiters: body.recruiters.map((r) => ({
        name: r.name?.trim() || null,
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
        results.sent === 1
          ? "Email sent successfully."
          : `${results.sent} emails sent successfully.`
      );
    } else if (results.sent === 0) {
      sendError(res, `All emails failed to send.\n${results.errors.join("\n")}`, 500);
    } else {
      sendSuccess(
        res,
        {
          sent: results.sent,
          failed: results.failed,
          errors: results.errors,
          jobApplicationId,
        },
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

    const templateVarsBase = await buildTemplateVars(userId);
    const resumePath = await getPrimaryResumePath(userId);
    const firstPosition = body.recruiters[0].position.trim();

    const [appResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_applications
         (user_id, company_name, job_title, status)
       VALUES (?, ?, ?, 'scheduled')`,
      [userId, "Direct Outreach", firstPosition]
    );

    const jobApplicationId = appResult.insertId;

    const scheduledIds: number[] = [];

    for (const recruiter of body.recruiters) {
      // ── Smart salutation for BODY — resolved NOW at schedule time ───────
      const salutation = getSmartSalutation(recruiter.name, recruiter.email);

      const vars = {
        ...templateVarsBase,
        position: recruiter.position.trim(),
        recruiterName: salutation,
      };

      const personalizedSubject = replaceTemplateVariables(body.emailSubject, vars);
      const personalizedBody = replaceTemplateVariables(body.emailBody, vars);

      // ── Raw name (or null) — used later by scheduler for Gmail "To:" ────
      const recipientName = recruiter.name?.trim() || null;

      const id = await scheduleEmail({
        userId,
        jobApplicationId,
        gmailAccountId,
        recipientName,
        recipientEmail: recruiter.email.trim().toLowerCase(),
        subject: personalizedSubject,
        body: personalizedBody,
        resumePath: resumePath || undefined,
        scheduledAt,
      });

      scheduledIds.push(id);
    }

    const total = body.recruiters.length;

    sendSuccess(
      res,
      {
        scheduled: total,
        scheduledAt: scheduledAt.toISOString(),
        scheduledIds,
        jobApplicationId,
      },
      total === 1
        ? "Email scheduled successfully."
        : `${total} emails scheduled successfully.`
    );
  } catch (error) {
    next(error);
  }
}

//getAllApplications
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
      SELECT
        id,
        user_id,
        company_name,
        job_title,
        job_url,
        job_description,
        status,
        applied_at,
        created_at,
        updated_at
      FROM job_applications
      WHERE user_id = ?
    `;

    const params: any[] = [userId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const [applications] = await pool.query(query, params);

    sendSuccess(
      res,
      applications,
      status
        ? `Applications with status '${status}' fetched successfully.`
        : "All applications fetched successfully."
    );
  } catch (error) {
    next(error);
  }
}