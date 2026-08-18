import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  sendApplication,
  scheduleApplication,
  getAllApplications,
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

router.get("/getAllApplications", getAllApplications);

export default router;