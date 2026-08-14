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
exports.replaceTemplateVariables = replaceTemplateVariables;
exports.getDefaultTemplate = getDefaultTemplate;
exports.getUserTemplates = getUserTemplates;
exports.sendJobApplicationEmails = sendJobApplicationEmails;
exports.scheduleEmail = scheduleEmail;
const db_1 = __importDefault(require("../database/db"));
const gmail_service_1 = require("./gmail.service");
function replaceTemplateVariables(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        result = result.replace(regex, value || "");
    }
    return result;
}
async function getDefaultTemplate(userId) {
    const [templates] = await db_1.default.query("SELECT * FROM email_templates WHERE user_id = ? AND is_default = 1", [userId]);
    return templates[0] || null;
}
async function getUserTemplates(userId) {
    const [templates] = await db_1.default.query("SELECT * FROM email_templates WHERE user_id = ? ORDER BY is_default DESC, created_at DESC", [userId]);
    return templates;
}
async function sendJobApplicationEmails(params) {
    const { client: gmailClient, account } = await Promise.resolve().then(() => __importStar(require("./gmail.service"))).then((m) => m.getGmailClient(params.userId));
    const results = { sent: 0, failed: 0, errors: [] };
    const attachments = [
        ...(params.resumePath ? [params.resumePath] : []),
        ...(params.additionalAttachments || []),
    ];
    for (const recruiter of params.recruiters) {
        const personalizedSubject = replaceTemplateVariables(params.subject, {
            ...params.templateVarsBase,
            recruiterName: recruiter.name,
        });
        const personalizedBody = replaceTemplateVariables(params.body, {
            ...params.templateVarsBase,
            recruiterName: recruiter.name,
        });
        // Create email log
        const [logResult] = await db_1.default.query(`INSERT INTO email_logs 
       (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email, subject, body, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sending')`, [
            params.userId,
            params.jobApplicationId,
            params.gmailAccountId,
            recruiter.name,
            recruiter.email.toLowerCase(),
            personalizedSubject,
            personalizedBody,
        ]);
        const emailLogId = logResult.insertId;
        try {
            const messageId = await (0, gmail_service_1.sendEmailViaGmail)(params.userId, recruiter.email.toLowerCase(), recruiter.name, personalizedSubject, personalizedBody, attachments);
            await db_1.default.query(`UPDATE email_logs 
         SET status = 'sent', gmail_message_id = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`, [messageId, emailLogId]);
            results.sent++;
        }
        catch (error) {
            await db_1.default.query(`UPDATE email_logs 
         SET status = 'failed', error_message = ?, updated_at = NOW()
         WHERE id = ?`, [error.message, emailLogId]);
            results.failed++;
            results.errors.push(`${recruiter.email}: ${error.message}`);
        }
    }
    // Update job application status
    const newStatus = results.sent > 0 ? "sent" : "failed";
    await db_1.default.query("UPDATE job_applications SET status = ?, applied_at = NOW(), updated_at = NOW() WHERE id = ?", [newStatus, params.jobApplicationId]);
    return results;
}
async function scheduleEmail(params) {
    const [result] = await db_1.default.query(`INSERT INTO scheduled_emails
     (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email,
      subject, body, resume_path, scheduled_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`, [
        params.userId,
        params.jobApplicationId,
        params.gmailAccountId,
        params.recipientName,
        params.recipientEmail.toLowerCase(),
        params.subject,
        params.body,
        params.resumePath || null,
        params.scheduledAt,
    ]);
    return result.insertId;
}
//# sourceMappingURL=email.service.js.map