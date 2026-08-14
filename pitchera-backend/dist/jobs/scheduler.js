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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_1 = __importStar(require("../database/db"));
const gmail_service_1 = require("../services/gmail.service");
const SCHEDULER_INTERVAL_MS = 30000; // 30 seconds
const BATCH_SIZE = 10;
async function processPendingEmails() {
    try {
        const [emails] = await db_1.default.query(`SELECT * FROM scheduled_emails
       WHERE status = 'scheduled'
         AND scheduled_at <= NOW()
         AND retry_count < max_retries
       ORDER BY scheduled_at ASC
       LIMIT ?`, [BATCH_SIZE]);
        if (emails.length === 0)
            return;
        console.log(`[Scheduler] Processing ${emails.length} scheduled emails`);
        for (const email of emails) {
            // Mark as sending
            await db_1.default.query("UPDATE scheduled_emails SET status = 'sending', updated_at = NOW() WHERE id = ?", [email.id]);
            try {
                const attachments = email.resume_path ? [email.resume_path] : [];
                const messageId = await (0, gmail_service_1.sendEmailViaGmail)(email.user_id, email.recipient_email, email.recipient_name || "", email.subject, email.body, attachments);
                await db_1.default.query(`UPDATE scheduled_emails 
           SET status = 'sent', sent_at = NOW(), updated_at = NOW()
           WHERE id = ?`, [email.id]);
                // Create email log
                await db_1.default.query(`INSERT INTO email_logs
           (user_id, job_application_id, gmail_account_id, recipient_name, recipient_email,
            subject, body, status, gmail_message_id, sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, NOW())`, [
                    email.user_id,
                    email.job_application_id,
                    email.gmail_account_id,
                    email.recipient_name,
                    email.recipient_email,
                    email.subject,
                    email.body,
                    messageId,
                ]);
                // Update job application status if applicable
                if (email.job_application_id) {
                    await db_1.default.query("UPDATE job_applications SET status = 'sent', applied_at = NOW(), updated_at = NOW() WHERE id = ? AND status = 'scheduled'", [email.job_application_id]);
                }
                console.log(`[Scheduler] ✅ Sent email to ${email.recipient_email} (ID: ${email.id})`);
            }
            catch (error) {
                const newRetryCount = email.retry_count + 1;
                const failed = newRetryCount >= email.max_retries;
                await db_1.default.query(`UPDATE scheduled_emails 
           SET status = ?, retry_count = ?, error_message = ?, updated_at = NOW()
           WHERE id = ?`, [
                    failed ? "failed" : "scheduled",
                    newRetryCount,
                    error.message,
                    email.id,
                ]);
                console.error(`[Scheduler] ❌ Failed to send email to ${email.recipient_email} (ID: ${email.id}): ${error.message}`);
            }
        }
    }
    catch (error) {
        console.error("[Scheduler] Error processing emails:", error.message);
    }
}
async function startScheduler() {
    console.log("🚀 Email scheduler starting...");
    await (0, db_1.testConnection)();
    console.log(`⏰ Scheduler running every ${SCHEDULER_INTERVAL_MS / 1000} seconds`);
    // Run immediately on start
    await processPendingEmails();
    setInterval(processPendingEmails, SCHEDULER_INTERVAL_MS);
}
startScheduler().catch((err) => {
    console.error("Scheduler failed to start:", err);
    process.exit(1);
});
//# sourceMappingURL=scheduler.js.map