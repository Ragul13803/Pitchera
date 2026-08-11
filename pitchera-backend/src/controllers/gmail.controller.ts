import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as googleService from "../services/google.service";
import * as gmailService from "../services/gmail.service";
import { sendSuccess, sendError } from "../utils/response";
import { env } from "../config/env";

export function initiateGmailAuth(req: AuthRequest, res: Response): void {
  const url = googleService.getGmailAuthUrl(req.user!.userId);
  sendSuccess(res, { url }, "Gmail auth URL generated");
}

export async function gmailCallback(
  req: AuthRequest & { query: { code?: string; error?: string; state?: string } },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, error, state } = req.query;

    if (error || !code) {
      res.redirect(
        `${env.frontendUrl}/connect-gmail?error=gmail_auth_failed`
      );
      return;
    }

    const userId = parseInt(state || "0", 10);

    if (!userId) {
      res.redirect(`${env.frontendUrl}/connect-gmail?error=invalid_state`);
      return;
    }

    const { accessToken, refreshToken, tokenExpiry, gmailAddress } =
      await googleService.exchangeGmailCode(String(code));

    await gmailService.saveGmailAccount(
      userId,
      gmailAddress,
      accessToken,
      refreshToken,
      tokenExpiry
    );

    res.redirect(
      `${env.frontendUrl}/connect-gmail?success=true&gmail=${encodeURIComponent(gmailAddress)}`
    );
  } catch (error: any) {
    console.error("Gmail callback error:", error);
    res.redirect(
      `${env.frontendUrl}/connect-gmail?error=${encodeURIComponent(error.message)}`
    );
  }
}

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

export async function disconnectGmail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await gmailService.disconnectGmail(req.user!.userId);
    sendSuccess(res, null, "Gmail disconnected");
  } catch (error) {
    next(error);
  }
}