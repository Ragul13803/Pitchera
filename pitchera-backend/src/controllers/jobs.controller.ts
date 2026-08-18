import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../database/db";
import * as emailService from "../services/email.service";
import * as gmailService from "../services/gmail.service";
import { sendSuccess, sendError } from "../utils/response";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getSmartSalutation } from "../utils/email";

const createJobSchema = z.object({
  companyName: z.string().min(1).max(255).trim(),
  jobTitle: z.string().min(1).max(255).trim(),
  jobUrl: z.string().url().optional().or(z.literal("")),
  jobDescription: z.string().optional(),

  recruiters: z
    .array(
      z.object({
        // Name is optional because recruiter may only provide an email
        name: z
          .string()
          .max(255)
          .trim()
          .optional()
          .nullable(),
        email: z.string().email().toLowerCase().trim(),
        position: z.string().max(255).trim().optional().default(""),
      })
    )
    .min(1, "At least one recruiter is required"),

  subject: z.string().min(1).max(500).trim(),
  body: z.string().min(1).trim(),
  useDefaultTemplate: z.boolean().default(false),
  resumeId: z.number().optional(),
  scheduledAt: z.string().optional(),
});

export async function createJobApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createJobSchema.parse(req.body);
    const userId = req.user!.userId;

    // ─────────────────────────────────────────────────────────────
    // Check for duplicate recruiter emails
    // ─────────────────────────────────────────────────────────────
    const emails = data.recruiters.map((r) => r.email);
    const uniqueEmails = new Set(emails);

    if (uniqueEmails.size !== emails.length) {
      sendError(res, "Duplicate recruiter emails detected", 400);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // Check Gmail connection
    // ─────────────────────────────────────────────────────────────
    const gmailStatus = await gmailService.getGmailStatus(userId);

    if (!gmailStatus.connected) {
      sendError(res, "Gmail account not connected", 400);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // Get active Gmail account
    // ─────────────────────────────────────────────────────────────
    const [gmailAccounts] = await pool.query<RowDataPacket[]>(
      `SELECT id
       FROM gmail_accounts
       WHERE user_id = ? AND is_active = 1
       LIMIT 1`,
      [userId]
    );

    if (gmailAccounts.length === 0) {
      sendError(res, "No active Gmail account found", 400);
      return;
    }

    const gmailAccountId = gmailAccounts[0].id;

    // ─────────────────────────────────────────────────────────────
    // Get resume path
    // ─────────────────────────────────────────────────────────────
    let resumePath: string | undefined;

    if (data.resumeId) {
      const [resumes] = await pool.query<RowDataPacket[]>(
        `SELECT file_path
         FROM resumes
         WHERE id = ? AND user_id = ?`,
        [data.resumeId, userId]
      );

      if (resumes.length > 0) {
        resumePath = resumes[0].file_path;
      }
    } else {
      const [primaryResumes] = await pool.query<RowDataPacket[]>(
        `SELECT file_path
         FROM resumes
         WHERE user_id = ? AND is_primary = 1
         LIMIT 1`,
        [userId]
      );

      if (primaryResumes.length > 0) {
        resumePath = primaryResumes[0].file_path;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Get user info for template variables
    // ─────────────────────────────────────────────────────────────
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT
         u.first_name,
         u.last_name,
         u.email,
         p.phone,
         p.total_experience,
         sl.linkedin,
         sl.github,
         sl.portfolio
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN social_links sl ON sl.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    const [skillRows] = await pool.query<RowDataPacket[]>(
      `SELECT name
       FROM skills
       WHERE user_id = ? AND type = 'technical'
       LIMIT 5`,
      [userId]
    );

    const user = users[0];

    const skills = skillRows
      .map((s) => s.name)
      .filter(Boolean)
      .join(", ");

    const templateVarsBase = {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      company: data.companyName,
      position: data.jobTitle,
      experience: user?.total_experience || "",
      skills,
      phone: user?.phone || "",
      email: user?.email || "",
      linkedin: user?.linkedin || "",
      github: user?.github || "",
      portfolio: user?.portfolio || "",
    };

    // ─────────────────────────────────────────────────────────────
    // Create job application
    // ─────────────────────────────────────────────────────────────
    const isScheduled = !!data.scheduledAt;

    const [jobResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_applications
       (
         user_id,
         company_name,
         job_title,
         job_url,
         job_description,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.companyName,
        data.jobTitle,
        data.jobUrl || null,
        data.jobDescription || null,
        isScheduled ? "scheduled" : "draft",
      ]
    );

    const jobApplicationId = jobResult.insertId;

    // ─────────────────────────────────────────────────────────────
    // Save recruiters
    //
    // Name can now be NULL.
    // ─────────────────────────────────────────────────────────────
    for (const recruiter of data.recruiters) {
      await pool.query(
        `INSERT INTO recruiters
         (user_id, name, email, company)
         VALUES (?, ?, ?, ?)`,
        [
          userId,
          recruiter.name?.trim() || null,
          recruiter.email.toLowerCase(),
          data.companyName,
        ]
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Scheduled emails
    //
    // IMPORTANT:
    // Subject/body are personalized NOW.
    //
    // recruiterName = smart salutation
    // recipientName = raw recruiter name
    //
    // Example:
    //
    // recruiter.name = "John Smith"
    // recruiterName   = "John"
    // recipientName   = "John Smith"
    //
    // recruiter.name = null
    // recruiterName   = "Hiring Team" / "Sir/Madam"
    // recipientName   = null
    // ─────────────────────────────────────────────────────────────
    if (isScheduled && data.scheduledAt) {
      const scheduledAt = new Date(data.scheduledAt);

      if (Number.isNaN(scheduledAt.getTime())) {
        sendError(res, "Invalid scheduledAt date", 400);
        return;
      }

      for (const recruiter of data.recruiters) {
        const salutation = getSmartSalutation(
          recruiter.name,
          recruiter.email
        );

        const vars = {
          ...templateVarsBase,
          position:
            recruiter.position?.trim() ||
            templateVarsBase.position ||
            "",
          recruiterName: salutation,
        };

        const personalizedSubject =
          emailService.replaceTemplateVariables(
            data.subject,
            vars
          );

        const personalizedBody =
          emailService.replaceTemplateVariables(
            data.body,
            vars
          );

        // Raw name only.
        // Do NOT pass smart salutation here.
        const recipientName =
          recruiter.name?.trim() || null;

        await emailService.scheduleEmail({
          userId,
          jobApplicationId,
          gmailAccountId,
          recipientName,
          recipientEmail: recruiter.email.toLowerCase(),
          subject: personalizedSubject,
          body: personalizedBody,
          resumePath,
          scheduledAt,
        });
      }

      sendSuccess(
        res,
        {
          jobApplicationId,
          scheduled: true,
        },
        "Emails scheduled successfully",
        201
      );

      return;
    }

    // ─────────────────────────────────────────────────────────────
    // Send immediately
    //
    // email.service.ts handles:
    //
    // 1. Smart salutation for {{recruiterName}}
    // 2. Raw recruiter.name for Gmail To display name
    // ─────────────────────────────────────────────────────────────
    const results = await emailService.sendJobApplicationEmails({
      userId,
      jobApplicationId,
      recruiters: data.recruiters.map((recruiter) => ({
        name: recruiter.name,
        email: recruiter.email,
        position:
          recruiter.position?.trim() ||
          data.jobTitle,
      })),
      subject: data.subject,
      body: data.body,
      resumePath,
      gmailAccountId,
      templateVarsBase,
    });

    sendSuccess(
      res,
      {
        jobApplicationId,
        ...results,
      },
      `Sent ${results.sent} email(s)${
        results.failed > 0
          ? `, ${results.failed} failed`
          : ""
      }`,
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function getJobApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const page = Math.max(
      parseInt(String(req.query.page || "1"), 10),
      1
    );

    const limit = Math.max(
      parseInt(String(req.query.limit || "10"), 10),
      1
    );

    const offset = (page - 1) * limit;

    const status = req.query.status as string;
    const search = req.query.search as string;

    let whereClause = "WHERE ja.user_id = ?";
    const queryParams: any[] = [userId];

    if (status) {
      whereClause += " AND ja.status = ?";
      queryParams.push(status);
    }

    if (search) {
      whereClause +=
        " AND (ja.company_name LIKE ? OR ja.job_title LIKE ?)";

      queryParams.push(
        `%${search}%`,
        `%${search}%`
      );
    }

    const [applications] = await pool.query<RowDataPacket[]>(
      `SELECT
         ja.id,
         ja.company_name,
         ja.job_title,
         ja.job_url,
         ja.status,
         ja.applied_at,
         ja.created_at,
         COUNT(DISTINCT el.id) AS email_count,
         MAX(r.name) AS recruiter_name,
         MAX(r.email) AS recruiter_email
       FROM job_applications ja
       LEFT JOIN email_logs el
         ON el.job_application_id = ja.id
       LEFT JOIN recruiters r
         ON r.company = ja.company_name
        AND r.user_id = ja.user_id
       ${whereClause}
       GROUP BY ja.id
       ORDER BY ja.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM job_applications ja
       ${whereClause}`,
      queryParams
    );

    const totalCount = parseInt(String(total), 10);

    sendSuccess(res, {
      applications: applications.map((a) => ({
        id: a.id,
        companyName: a.company_name,
        jobTitle: a.job_title,
        jobUrl: a.job_url,
        status: a.status,
        appliedAt: a.applied_at,
        createdAt: a.created_at,
        emailCount: a.email_count,
        recruiterName: a.recruiter_name,
        recruiterEmail: a.recruiter_email,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const [applications] = await pool.query<RowDataPacket[]>(
      `SELECT *
       FROM job_applications
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (applications.length === 0) {
      sendError(res, "Job application not found", 404);
      return;
    }

    const [emailLogs] = await pool.query<RowDataPacket[]>(
      `SELECT
         id,
         recipient_name,
         recipient_email,
         subject,
         status,
         sent_at,
         created_at,
         error_message
       FROM email_logs
       WHERE job_application_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    const app = applications[0];

    sendSuccess(res, {
      id: app.id,
      companyName: app.company_name,
      jobTitle: app.job_title,
      jobUrl: app.job_url,
      jobDescription: app.job_description,
      status: app.status,
      appliedAt: app.applied_at,
      createdAt: app.created_at,

      emailLogs: emailLogs.map((e) => ({
        id: e.id,
        recipientName: e.recipient_name,
        recipientEmail: e.recipient_email,
        subject: e.subject,
        status: e.status,
        sentAt: e.sent_at,
        createdAt: e.created_at,
        errorMessage: e.error_message,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJobStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "draft",
      "scheduled",
      "sent",
      "failed",
      "interview",
      "rejected",
      "selected",
      "offer",
    ];

    if (!validStatuses.includes(status)) {
      sendError(res, "Invalid status", 400);
      return;
    }

    await pool.query(
      `UPDATE job_applications
       SET status = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [status, id, req.user!.userId]
    );

    sendSuccess(res, null, "Status updated");
  } catch (error) {
    next(error);
  }
}