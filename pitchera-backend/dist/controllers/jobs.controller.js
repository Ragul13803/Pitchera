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
exports.createJobApplication = createJobApplication;
exports.getJobApplications = getJobApplications;
exports.getJobApplication = getJobApplication;
exports.updateJobStatus = updateJobStatus;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../database/db"));
const emailService = __importStar(require("../services/email.service"));
const gmailService = __importStar(require("../services/gmail.service"));
const response_1 = require("../utils/response");
const createJobSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).max(255).trim(),
    jobTitle: zod_1.z.string().min(1).max(255).trim(),
    jobUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    jobDescription: zod_1.z.string().optional(),
    recruiters: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).trim(),
        email: zod_1.z.string().email().toLowerCase().trim(),
    })).min(1, "At least one recruiter is required"),
    subject: zod_1.z.string().min(1).max(500).trim(),
    body: zod_1.z.string().min(1).trim(),
    useDefaultTemplate: zod_1.z.boolean().default(false),
    resumeId: zod_1.z.number().optional(),
    scheduledAt: zod_1.z.string().optional(),
});
async function createJobApplication(req, res, next) {
    try {
        const data = createJobSchema.parse(req.body);
        const userId = req.user.userId;
        // Check for duplicate recruiter emails
        const emails = data.recruiters.map((r) => r.email);
        const uniqueEmails = new Set(emails);
        if (uniqueEmails.size !== emails.length) {
            (0, response_1.sendError)(res, "Duplicate recruiter emails detected", 400);
            return;
        }
        // Check Gmail connection
        const gmailStatus = await gmailService.getGmailStatus(userId);
        if (!gmailStatus.connected) {
            (0, response_1.sendError)(res, "Gmail account not connected", 400);
            return;
        }
        // Get Gmail account
        const [gmailAccounts] = await db_1.default.query("SELECT id FROM gmail_accounts WHERE user_id = ? AND is_active = 1", [userId]);
        const gmailAccountId = gmailAccounts[0].id;
        // Get resume path if specified
        let resumePath;
        if (data.resumeId) {
            const [resumes] = await db_1.default.query("SELECT file_path FROM resumes WHERE id = ? AND user_id = ?", [data.resumeId, userId]);
            if (resumes.length > 0) {
                resumePath = resumes[0].file_path;
            }
        }
        else {
            // Get primary resume
            const [primaryResumes] = await db_1.default.query("SELECT file_path FROM resumes WHERE user_id = ? AND is_primary = 1", [userId]);
            if (primaryResumes.length > 0) {
                resumePath = primaryResumes[0].file_path;
            }
        }
        // Get user info for template vars
        const [users] = await db_1.default.query(`SELECT u.first_name, u.last_name, u.email,
              p.phone, p.total_experience,
              sl.linkedin, sl.github, sl.portfolio
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN social_links sl ON sl.user_id = u.id
       WHERE u.id = ?`, [userId]);
        const [skillRows] = await db_1.default.query("SELECT name FROM skills WHERE user_id = ? AND type = 'technical' LIMIT 5", [userId]);
        const user = users[0];
        const skills = skillRows.map((s) => s.name).join(", ");
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
        // Create job application record
        const isScheduled = !!data.scheduledAt;
        const [jobResult] = await db_1.default.query(`INSERT INTO job_applications (user_id, company_name, job_title, job_url, job_description, status)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            userId,
            data.companyName,
            data.jobTitle,
            data.jobUrl || null,
            data.jobDescription || null,
            isScheduled ? "scheduled" : "draft",
        ]);
        const jobApplicationId = jobResult.insertId;
        // Save recruiters
        for (const recruiter of data.recruiters) {
            await db_1.default.query("INSERT INTO recruiters (user_id, name, email, company) VALUES (?, ?, ?, ?)", [userId, recruiter.name, recruiter.email, data.companyName]);
        }
        if (isScheduled && data.scheduledAt) {
            // Schedule emails
            for (const recruiter of data.recruiters) {
                const personalizedSubject = emailService.replaceTemplateVariables(data.subject, { ...templateVarsBase, recruiterName: recruiter.name });
                const personalizedBody = emailService.replaceTemplateVariables(data.body, { ...templateVarsBase, recruiterName: recruiter.name });
                await emailService.scheduleEmail({
                    userId,
                    jobApplicationId,
                    gmailAccountId,
                    recipientName: recruiter.name,
                    recipientEmail: recruiter.email,
                    subject: personalizedSubject,
                    body: personalizedBody,
                    resumePath,
                    scheduledAt: new Date(data.scheduledAt),
                });
            }
            (0, response_1.sendSuccess)(res, { jobApplicationId, scheduled: true }, "Emails scheduled successfully", 201);
        }
        else {
            // Send immediately
            const results = await emailService.sendJobApplicationEmails({
                userId,
                jobApplicationId,
                recruiters: data.recruiters,
                subject: data.subject,
                body: data.body,
                resumePath,
                gmailAccountId,
                templateVarsBase,
            });
            (0, response_1.sendSuccess)(res, { jobApplicationId, ...results }, `Sent ${results.sent} email(s)${results.failed > 0 ? `, ${results.failed} failed` : ""}`, 201);
        }
    }
    catch (error) {
        next(error);
    }
}
async function getJobApplications(req, res, next) {
    try {
        const userId = req.user.userId;
        const page = parseInt(String(req.query.page || "1"), 10);
        const limit = parseInt(String(req.query.limit || "10"), 10);
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        let whereClause = "WHERE ja.user_id = ?";
        const queryParams = [userId];
        if (status) {
            whereClause += " AND ja.status = ?";
            queryParams.push(status);
        }
        if (search) {
            whereClause += " AND (ja.company_name LIKE ? OR ja.job_title LIKE ?)";
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        const [applications] = await db_1.default.query(`SELECT ja.id, ja.company_name, ja.job_title, ja.job_url, ja.status,
              ja.applied_at, ja.created_at,
              COUNT(DISTINCT el.id) as email_count,
              MAX(r.name) as recruiter_name,
              MAX(r.email) as recruiter_email
       FROM job_applications ja
       LEFT JOIN email_logs el ON el.job_application_id = ja.id
       LEFT JOIN recruiters r ON r.company = ja.company_name AND r.user_id = ja.user_id
       ${whereClause}
       GROUP BY ja.id
       ORDER BY ja.created_at DESC
       LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);
        const [[{ total }]] = await db_1.default.query(`SELECT COUNT(*) as total FROM job_applications ja ${whereClause}`, queryParams);
        (0, response_1.sendSuccess)(res, {
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
                total: parseInt(String(total)),
                pages: Math.ceil(parseInt(String(total)) / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function getJobApplication(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const [applications] = await db_1.default.query("SELECT * FROM job_applications WHERE id = ? AND user_id = ?", [id, userId]);
        if (applications.length === 0) {
            (0, response_1.sendError)(res, "Job application not found", 404);
            return;
        }
        const [emailLogs] = await db_1.default.query(`SELECT id, recipient_name, recipient_email, subject, status, 
              sent_at, created_at, error_message
       FROM email_logs WHERE job_application_id = ? ORDER BY created_at DESC`, [id]);
        const app = applications[0];
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
}
async function updateJobStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = [
            "draft", "scheduled", "sent", "failed",
            "interview", "rejected", "selected", "offer",
        ];
        if (!validStatuses.includes(status)) {
            (0, response_1.sendError)(res, "Invalid status", 400);
            return;
        }
        await db_1.default.query("UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?", [status, id, req.user.userId]);
        (0, response_1.sendSuccess)(res, null, "Status updated");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=jobs.controller.js.map