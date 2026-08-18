import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";
import * as googleService from "../services/google.service";
import { sendSuccess, sendError } from "../utils/response";
import { env } from "../config/env";

const registerSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const googleMobileSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.registerUser(
      data.firstName,
      data.lastName,
      data.email,
      data.password
    );
    sendSuccess(res, result, "Registration successful", 201);
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginUser(data.email, data.password);
    sendSuccess(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log("========== REFRESH TOKEN REQUEST ==========");
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("Has refreshToken:", !!req.body?.refreshToken);

    const { refreshToken } = req.body;

    if (!refreshToken) {
      console.error("❌ Refresh token missing from request body");
      sendError(res, "Refresh token required", 400);
      return;
    }

    console.log("Refresh token length:", refreshToken.length);
    console.log(
      "Refresh token preview:",
      `${refreshToken.substring(0, 10)}...`
    );

    console.log("Calling authService.refreshAccessToken()...");

    const tokens = await authService.refreshAccessToken(refreshToken);

    console.log("✅ Token refresh successful");
    console.log("Returned token keys:", Object.keys(tokens || {}));

    sendSuccess(res, tokens, "Token refreshed");
  } catch (error) {
    console.error("❌ Refresh token controller error:", error);
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
}

export function googleAuth(req: Request, res: Response): void {
  const url = googleService.getGoogleLoginUrl();
  res.redirect(url);
}

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, error } = req.query;

    if (error || !code) {
      res.redirect(`${env.frontendUrl}/(auth)/login?error=google_auth_failed`);
      return;
    }

    const googleUser = await googleService.getGoogleUserInfo(String(code));
    const result = await authService.findOrCreateGoogleUser(googleUser);

    const params = new URLSearchParams({
      accessToken: (result as any).accessToken,
      refreshToken: (result as any).refreshToken,
    });

    res.redirect(`${env.frontendUrl}/auth/callback?${params.toString()}`);
  } catch (error) {
    next(error);
  }
}

// Mobile Google authentication
export async function googleMobileAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idToken } = googleMobileSchema.parse(req.body);

    // Verify the Google ID token
    const googleUser = await googleService.verifyGoogleIdToken(idToken);

    // Find or create user
    const result = await authService.findOrCreateGoogleUser({
      googleId: googleUser.googleId,
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      avatarUrl: googleUser.avatarUrl,
    });

    sendSuccess(res, result, "Google authentication successful");
  } catch (error: any) {
    console.error("Google mobile auth error:", error);

    if (error.message?.includes("Invalid Google ID token")) {
      sendError(res, "Invalid Google authentication token", 401);
    } else {
      next(error);
    }
  }
}

// Verify token
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const pool = (await import("../database/db")).default;

    const [users] = await pool.query<any[]>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url,
              u.is_email_verified, u.is_active,
              p.profile_photo_url, p.current_job_title
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      sendError(res, "User not found", 404);
      return;
    }

    const user = users[0];

    sendSuccess(
      res,
      {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        avatarUrl: user.profile_photo_url || user.avatar_url,
        currentJobTitle: user.current_job_title,
        isEmailVerified: Boolean(user.is_email_verified),
        isActive: Boolean(user.is_active),
      },
      "Token is valid"
    );
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "User not authenticated", 401);
      return;
    }

    const pool = (await import("../database/db")).default;

    const [users] = await pool.query<any[]>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url,
              p.profile_photo_url, p.current_job_title
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      sendError(res, "User not found", 404);
      return;
    }

    const user = users[0];
    sendSuccess(res, {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      avatarUrl: user.profile_photo_url || user.avatar_url,
      currentJobTitle: user.current_job_title,
    });
  } catch (error) {
    next(error);
  }
}