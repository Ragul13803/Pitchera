import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Standard auth
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

// Google OAuth - Web Flow
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);

// ===== NEW: Google OAuth - Mobile Flow =====
router.post("/google/mobile", authController.googleMobileAuth);

// Protected routes
router.get("/me", authenticate, authController.getMe);
router.get("/verify", authenticate, authController.verifyToken);

export default router;