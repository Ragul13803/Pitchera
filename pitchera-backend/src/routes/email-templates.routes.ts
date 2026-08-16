import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getDefaultTemplate } from "../controllers/email-templates.controller";

const router = Router();

router.use(authenticate);

/**
 * GET /api/email-templates/default
 */
router.get("/default", getDefaultTemplate);

export default router;