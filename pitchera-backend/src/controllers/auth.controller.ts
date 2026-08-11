import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";
import * as googleService from "../services/google.service";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
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
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendError(res, "Refresh token required", 400);
      return;
    }
    const tokens = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, tokens, "Token refreshed");
  } catch (error) {
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
      res.redirect(
        `${env.frontendUrl}/login?error=google_auth_failed`
      );
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

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // const { RowDataPacket } = await import("mysql2");
    const pool = (await import("../database/db")).default;

    const [users] = await pool.query<any[]>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url,
              p.profile_photo_url, p.current_job_title
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user!.userId]
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