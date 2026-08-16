import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import pool from "../database/db";
import { sendSuccess } from "../utils/response";
import { RowDataPacket } from "mysql2";

// Hardcoded system fallback — only used if user has zero templates
const SYSTEM_DEFAULT_TEMPLATE = {
  subject: "Application for {{position}} - {{firstName}} {{lastName}}",
  body: `Dear {{recruiterName}},

I am writing to express my interest in the {{position}} position at {{company}}.

I have {{experience}} of experience in {{skills}}.

Please find my resume attached for your consideration.

I would appreciate the opportunity to discuss my profile with you.

Thank you for your time and consideration.

Best regards,

{{firstName}} {{lastName}}
{{email}}
{{phone}}
{{linkedin}}`,
};

/**
 * GET /api/email-templates/default
 * Returns the user's default template (is_default = 1).
 * Falls back to SYSTEM_DEFAULT_TEMPLATE if none configured.
 */
export async function getDefaultTemplate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, subject, body, is_default
       FROM email_templates
       WHERE user_id = ? AND is_default = 1
       LIMIT 1`,
      [userId]
    );

    if (rows.length > 0) {
      sendSuccess(res, {
        id: rows[0].id,
        name: rows[0].name,
        subject: rows[0].subject,
        body: rows[0].body,
        isDefault: true,
        source: "user",
      });
      return;
    }

    // No user template — return system fallback
    sendSuccess(res, {
      id: null,
      name: "Default Template",
      subject: SYSTEM_DEFAULT_TEMPLATE.subject,
      body: SYSTEM_DEFAULT_TEMPLATE.body,
      isDefault: true,
      source: "system",
    });
  } catch (error) {
    next(error);
  }
}