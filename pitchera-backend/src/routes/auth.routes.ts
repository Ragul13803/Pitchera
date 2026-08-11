import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

// Google OAuth
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);

// Protected
router.get("/me", authenticate, authController.getMe);

export default router;