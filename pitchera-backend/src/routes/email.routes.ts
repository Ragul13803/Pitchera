import { Router } from "express";
import * as emailController from "../controllers/email.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/history", emailController.getEmailHistory);
router.get("/history/:id", emailController.getEmailDetail);

router.get("/scheduled", emailController.getScheduledEmails);
router.delete("/scheduled/:id", emailController.cancelScheduledEmail);

router.get("/templates", emailController.getTemplates);
router.post("/templates", emailController.createTemplate);
router.put("/templates/:id", emailController.updateTemplate);
router.delete("/templates/:id", emailController.deleteTemplate);

router.get("/dashboard", emailController.getDashboardStats);

export default router;