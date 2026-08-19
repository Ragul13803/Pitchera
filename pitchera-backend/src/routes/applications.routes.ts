import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  sendApplication,
  scheduleApplication,
  getAllApplications,
  processScheduledEmails,
} from "../controllers/applications.controller";

const router = Router();

router.use(authenticate);

/**
 * POST /api/applications/send
 * Send job application emails immediately via Gmail.
 */
router.post("/send", sendApplication);

/**
 * POST /api/applications/schedule
 * Schedule job application emails for future sending.
 */
router.post("/schedule", scheduleApplication);

/**
 * POST /api/applications/process-scheduled
 * Manually trigger a pass over due scheduled_emails rows.
 * For hosting setups where the in-process cron loop won't stay alive
 * (e.g. serverless) — point an external cron at this endpoint instead.
 */
router.post("/process-scheduled", processScheduledEmails);

router.get("/getAllApplications", getAllApplications);

export default router;