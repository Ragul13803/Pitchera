import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../database/db";
import * as emailService from "../services/email.service";
import { sendSuccess, sendError } from "../utils/response";
import { RowDataPacket } from "mysql2";

export async function getEmailHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(String(req.query.page || "1"), 10);
    const limit = parseInt(String(req.query.limit || "20"), 10);
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let whereClause = "WHERE el.user_id = ?";
    const queryParams: any[] = [userId];

    if (status) {
      whereClause += " AND el.status = ?";
      queryParams.push(status);
    }

    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT el.id, el.recipient_name, el.recipient_email, el.subject,
              el.status, el.sent_at, el.created_at, el.error_message,
              ja.company_name, ja.job_title
       FROM email_logs el
       LEFT JOIN job_applications ja ON ja.id = el.job_application_id
       ${whereClause}
       ORDER BY el.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM email_logs el ${whereClause}`,
      queryParams
    );

    sendSuccess(res, {
      logs: logs.map((l) => ({
        id: l.id,
        recipientName: l.recipient_name,
        recipientEmail: l.recipient_email,
        subject: l.subject,
        status: l.status,
        sentAt: l.sent_at,
        createdAt: l.created_at,
        errorMessage: l.error_message,
        companyName: l.company_name,
        jobTitle: l.job_title,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(String(total)),
        pages: Math.ceil(parseInt(String(total)) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmailDetail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT el.*, ja.company_name, ja.job_title
       FROM email_logs el
       LEFT JOIN job_applications ja ON ja.id = el.job_application_id
       WHERE el.id = ? AND el.user_id = ?`,
      [id, userId]
    );

    if (logs.length === 0) {
      sendError(res, "Email log not found", 404);
      return;
    }

    const log = logs[0];
    sendSuccess(res, {
      id: log.id,
      recipientName: log.recipient_name,
      recipientEmail: log.recipient_email,
      subject: log.subject,
      body: log.body,
      status: log.status,
      sentAt: log.sent_at,
      createdAt: log.created_at,
      errorMessage: log.error_message,
      gmailMessageId: log.gmail_message_id,
      companyName: log.company_name,
      jobTitle: log.job_title,
    });
  } catch (error) {
    next(error);
  }
}

export async function getScheduledEmails(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(String(req.query.page || "1"), 10);
    const limit = parseInt(String(req.query.limit || "20"), 10);
    const offset = (page - 1) * limit;

    const [emails] = await pool.query<RowDataPacket[]>(
      `SELECT se.id, se.recipient_name, se.recipient_email, se.subject,
              se.status, se.scheduled_at, se.sent_at, se.retry_count,
              se.error_message, se.created_at,
              ja.company_name, ja.job_title
       FROM scheduled_emails se
       LEFT JOIN job_applications ja ON ja.id = se.job_application_id
       WHERE se.user_id = ?
       ORDER BY se.scheduled_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM scheduled_emails WHERE user_id = ?",
      [userId]
    );

    sendSuccess(res, {
      emails: emails.map((e) => ({
        id: e.id,
        recipientName: e.recipient_name,
        recipientEmail: e.recipient_email,
        subject: e.subject,
        status: e.status,
        scheduledAt: e.scheduled_at,
        sentAt: e.sent_at,
        retryCount: e.retry_count,
        errorMessage: e.error_message,
        createdAt: e.created_at,
        companyName: e.company_name,
        jobTitle: e.job_title,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(String(total)),
        pages: Math.ceil(parseInt(String(total)) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelScheduledEmail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const [result] = await pool.query(
      `UPDATE scheduled_emails 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = ? AND user_id = ? AND status = 'scheduled'`,
      [id, userId]
    ) as any;

    if (result.affectedRows === 0) {
      sendError(res, "Scheduled email not found or already processed", 404);
      return;
    }

    sendSuccess(res, null, "Scheduled email cancelled");
  } catch (error) {
    next(error);
  }
}

export async function getTemplates(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const templates = await emailService.getUserTemplates(req.user!.userId);
    sendSuccess(res, templates);
  } catch (error) {
    next(error);
  }
}

function validateTemplateBody(body: any): string | null {
  if (!body.name?.trim()) return "Template name is required.";
  if (!body.subject?.trim()) return "Subject is required.";
  if (!body.body?.trim()) return "Body is required.";
  return null;
}

export async function createTemplate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationError = validateTemplateBody(req.body);
    if (validationError) { sendError(res, validationError, 400); return; }

    const template = await emailService.createTemplate({
      userId: req.user!.userId,
      name: req.body.name.trim(),
      subject: req.body.subject.trim(),
      body: req.body.body.trim(),
      isDefault: !!req.body.isDefault,
    });
    sendSuccess(res, template, "Template created successfully.", 201);
  } catch (error) {
    next(error);
  }
}

export async function updateTemplate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationError = validateTemplateBody(req.body);
    if (validationError) { sendError(res, validationError, 400); return; }

    const template = await emailService.updateTemplate({
      userId: req.user!.userId,
      templateId: parseInt(req.params.id, 10),
      name: req.body.name.trim(),
      subject: req.body.subject.trim(),
      body: req.body.body.trim(),
      isDefault: !!req.body.isDefault,
    });

    if (!template) { sendError(res, "Template not found.", 404); return; }
    sendSuccess(res, template, "Template updated successfully.");
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await emailService.deleteTemplate(
      req.user!.userId,
      parseInt(req.params.id, 10)
    );
    if (!deleted) { sendError(res, "Template not found.", 404); return; }
    sendSuccess(res, null, "Template deleted successfully.");
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [[stats]] = await pool.query<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM job_applications WHERE user_id = ?) as total_applications,
        (SELECT COUNT(*) FROM email_logs WHERE user_id = ? AND status = 'sent') as emails_sent,
        (SELECT COUNT(*) FROM scheduled_emails WHERE user_id = ? AND status = 'scheduled') as scheduled_emails,
        (SELECT COUNT(*) FROM email_logs WHERE user_id = ? AND status = 'failed') as failed_emails`,
      [userId, userId, userId, userId]
    );

    const [recentApps] = await pool.query<RowDataPacket[]>(
      `SELECT id, company_name, job_title, status, applied_at, created_at
       FROM job_applications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    const [upcomingScheduled] = await pool.query<RowDataPacket[]>(
      `SELECT se.id, se.recipient_name, se.recipient_email, se.subject, se.scheduled_at,
              ja.company_name, ja.job_title
       FROM scheduled_emails se
       LEFT JOIN job_applications ja ON ja.id = se.job_application_id
       WHERE se.user_id = ? AND se.status = 'scheduled' AND se.scheduled_at > NOW()
       ORDER BY se.scheduled_at ASC LIMIT 5`,
      [userId]
    );

    const gmailStatus = await gmailService.getGmailStatus(userId);

    sendSuccess(res, {
      stats: {
        totalApplications: stats.total_applications,
        emailsSent: stats.emails_sent,
        scheduledEmails: stats.scheduled_emails,
        failedEmails: stats.failed_emails,
      },
      recentApplications: recentApps.map((a) => ({
        id: a.id,
        companyName: a.company_name,
        jobTitle: a.job_title,
        status: a.status,
        appliedAt: a.applied_at,
        createdAt: a.created_at,
      })),
      upcomingScheduled: upcomingScheduled.map((s) => ({
        id: s.id,
        recipientName: s.recipient_name,
        recipientEmail: s.recipient_email,
        scheduledAt: s.scheduled_at,
        companyName: s.company_name,
        jobTitle: s.job_title,
      })),
      gmailStatus,
    });
  } catch (error) {
    next(error);
  }
}

// Import for gmailService
import * as gmailService from "../services/gmail.service";