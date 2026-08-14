"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailHistory = getEmailHistory;
exports.getEmailDetail = getEmailDetail;
exports.getScheduledEmails = getScheduledEmails;
exports.cancelScheduledEmail = cancelScheduledEmail;
exports.getTemplates = getTemplates;
exports.getDashboardStats = getDashboardStats;
const db_1 = __importDefault(require("../database/db"));
const emailService = __importStar(require("../services/email.service"));
const response_1 = require("../utils/response");
async function getEmailHistory(req, res, next) {
    try {
        const userId = req.user.userId;
        const page = parseInt(String(req.query.page || "1"), 10);
        const limit = parseInt(String(req.query.limit || "20"), 10);
        const offset = (page - 1) * limit;
        const status = req.query.status;
        let whereClause = "WHERE el.user_id = ?";
        const queryParams = [userId];
        if (status) {
            whereClause += " AND el.status = ?";
            queryParams.push(status);
        }
        const [logs] = await db_1.default.query(`SELECT el.id, el.recipient_name, el.recipient_email, el.subject,
              el.status, el.sent_at, el.created_at, el.error_message,
              ja.company_name, ja.job_title
       FROM email_logs el
       LEFT JOIN job_applications ja ON ja.id = el.job_application_id
       ${whereClause}
       ORDER BY el.created_at DESC
       LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);
        const [[{ total }]] = await db_1.default.query(`SELECT COUNT(*) as total FROM email_logs el ${whereClause}`, queryParams);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
}
async function getEmailDetail(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const [logs] = await db_1.default.query(`SELECT el.*, ja.company_name, ja.job_title
       FROM email_logs el
       LEFT JOIN job_applications ja ON ja.id = el.job_application_id
       WHERE el.id = ? AND el.user_id = ?`, [id, userId]);
        if (logs.length === 0) {
            (0, response_1.sendError)(res, "Email log not found", 404);
            return;
        }
        const log = logs[0];
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
}
async function getScheduledEmails(req, res, next) {
    try {
        const userId = req.user.userId;
        const page = parseInt(String(req.query.page || "1"), 10);
        const limit = parseInt(String(req.query.limit || "20"), 10);
        const offset = (page - 1) * limit;
        const [emails] = await db_1.default.query(`SELECT se.id, se.recipient_name, se.recipient_email, se.subject,
              se.status, se.scheduled_at, se.sent_at, se.retry_count,
              se.error_message, se.created_at,
              ja.company_name, ja.job_title
       FROM scheduled_emails se
       LEFT JOIN job_applications ja ON ja.id = se.job_application_id
       WHERE se.user_id = ?
       ORDER BY se.scheduled_at DESC
       LIMIT ? OFFSET ?`, [userId, limit, offset]);
        const [[{ total }]] = await db_1.default.query("SELECT COUNT(*) as total FROM scheduled_emails WHERE user_id = ?", [userId]);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
}
async function cancelScheduledEmail(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const [result] = await db_1.default.query(`UPDATE scheduled_emails 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = ? AND user_id = ? AND status = 'scheduled'`, [id, userId]);
        if (result.affectedRows === 0) {
            (0, response_1.sendError)(res, "Scheduled email not found or already processed", 404);
            return;
        }
        (0, response_1.sendSuccess)(res, null, "Scheduled email cancelled");
    }
    catch (error) {
        next(error);
    }
}
async function getTemplates(req, res, next) {
    try {
        const templates = await emailService.getUserTemplates(req.user.userId);
        (0, response_1.sendSuccess)(res, templates);
    }
    catch (error) {
        next(error);
    }
}
async function getDashboardStats(req, res, next) {
    try {
        const userId = req.user.userId;
        const [[stats]] = await db_1.default.query(`SELECT
        (SELECT COUNT(*) FROM job_applications WHERE user_id = ?) as total_applications,
        (SELECT COUNT(*) FROM email_logs WHERE user_id = ? AND status = 'sent') as emails_sent,
        (SELECT COUNT(*) FROM scheduled_emails WHERE user_id = ? AND status = 'scheduled') as scheduled_emails,
        (SELECT COUNT(*) FROM email_logs WHERE user_id = ? AND status = 'failed') as failed_emails`, [userId, userId, userId, userId]);
        const [recentApps] = await db_1.default.query(`SELECT id, company_name, job_title, status, applied_at, created_at
       FROM job_applications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`, [userId]);
        const [upcomingScheduled] = await db_1.default.query(`SELECT se.id, se.recipient_name, se.recipient_email, se.subject, se.scheduled_at,
              ja.company_name, ja.job_title
       FROM scheduled_emails se
       LEFT JOIN job_applications ja ON ja.id = se.job_application_id
       WHERE se.user_id = ? AND se.status = 'scheduled' AND se.scheduled_at > NOW()
       ORDER BY se.scheduled_at ASC LIMIT 5`, [userId]);
        const gmailStatus = await gmailService.getGmailStatus(userId);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
}
// Import for gmailService
const gmailService = __importStar(require("../services/gmail.service"));
//# sourceMappingURL=email.controller.js.map