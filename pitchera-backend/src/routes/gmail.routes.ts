import { Router } from "express";
import * as gmailController from "../controllers/gmail.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Initiate Gmail OAuth
router.get("/connect", authenticate, gmailController.initiateGmailAuth);

// Gmail OAuth callback (no auth middleware - called by Google)
router.get("/oauth/callback", gmailController.gmailCallback as any);

// Gmail status and management
router.get("/status", authenticate, gmailController.getGmailStatus);
router.delete("/disconnect", authenticate, gmailController.disconnectGmail);

export default router;