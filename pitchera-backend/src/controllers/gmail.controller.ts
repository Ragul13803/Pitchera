// backend/src/controllers/gmail.controller.ts
// FULL FILE — replaces existing

import { Response, NextFunction, Request } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as googleService from "../services/google.service";
import * as gmailService from "../services/gmail.service";
import { sendSuccess, sendError } from "../utils/response";
import { env } from "../config/env";

// ─── Initiate Gmail OAuth ─────────────────────────────────────────────────────

export function initiateGmailAuth(req: AuthRequest, res: Response): void {
  const userId = req.user!.userId;
  const url = googleService.getGmailAuthUrl(userId);
  sendSuccess(res, { url }, "Gmail auth URL generated");
}

// ─── Gmail OAuth Callback ─────────────────────────────────────────────────────

export async function gmailCallback(
  req: Request & {
    query: { code?: string; error?: string; state?: string };
  },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, error, state } = req.query;

    // ── Error from Google ──────────────────────────────────────────────────
    if (error || !code) {
      const reason = encodeURIComponent(String(error || "gmail_auth_failed"));

      // Redirect both web and app deep link
      res.redirect(
        `${env.frontendUrl}/connect-gmail?error=${reason}`
      );
      return;
    }

    // ── Validate state (contains userId) ──────────────────────────────────
    const userId = parseInt(String(state || "0"), 10);

    if (!userId || isNaN(userId)) {
      res.redirect(`${env.frontendUrl}/connect-gmail?error=invalid_state`);
      return;
    }

    // ── Exchange code for tokens ───────────────────────────────────────────
    const { accessToken, refreshToken, tokenExpiry, gmailAddress } =
      await googleService.exchangeGmailCode(String(code));

    // ── Save to DB ────────────────────────────────────────────────────────
    await gmailService.saveGmailAccount(
      userId,
      gmailAddress,
      accessToken,
      refreshToken,
      tokenExpiry
    );

    console.log(
      `[Gmail OAuth] ✅ Connected ${gmailAddress} for user ${userId}`
    );

    // ── Redirect back to app ───────────────────────────────────────────────
    // Works for both Expo web (/connect-gmail) and
    // Expo Go deep link (pitchera://connect-gmail)
    const successUrl = `${env.frontendUrl}/connect-gmail?success=true&gmail=${encodeURIComponent(gmailAddress)}`;

    res.redirect(successUrl);
  } catch (err: any) {
    console.error("[Gmail OAuth] Callback error:", err.message);
    const reason = encodeURIComponent(err.message || "unknown_error");
    res.redirect(`${env.frontendUrl}/connect-gmail?error=${reason}`);
  }
}

// ─── Get Gmail Status ─────────────────────────────────────────────────────────

export async function getGmailStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await gmailService.getGmailStatus(req.user!.userId);
    sendSuccess(res, status);
  } catch (error) {
    next(error);
  }
}

// ─── Disconnect Gmail ─────────────────────────────────────────────────────────

export async function disconnectGmail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await gmailService.disconnectGmail(req.user!.userId);
    sendSuccess(res, null, "Gmail disconnected successfully");
  } catch (error) {
    next(error);
  }
}