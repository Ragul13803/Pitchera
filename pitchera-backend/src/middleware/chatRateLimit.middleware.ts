// src/middleware/chatRateLimitMiddleware.ts
import { Request, Response, NextFunction } from 'express';

import { RATE_LIMIT_CONFIG } from '../config/rateLimit';
import { checkAndConsumeRateLimit, getRateLimitStatus } from '../services/rateLimit.service';

/* ─────────────────────────────────────────────────────────
   Resolve integer user ID from your JWT middleware.
   Adjust field names to match whatever your auth middleware
   attaches to req.user.
───────────────────────────────────────────────────────── */
function resolveUserId(req: Request): number | null {
  const u = (req as any).user;
  if (!u) return null;

  const raw    = u.id ?? u.userId ?? u.user_id ?? u.sub;
  const parsed = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/* ─────────────────────────────────────────────────────────
   Middleware: consumes one rate-limit slot per request.
   Attach AFTER your authenticate middleware.
───────────────────────────────────────────────────────── */
export async function chatRateLimitMiddleware(
  req:  Request,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  const userId = resolveUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  try {
    const result = await checkAndConsumeRateLimit(userId);

    /* Always expose rate-limit state in response headers */
    res.setHeader('X-RateLimit-Limit',     String(RATE_LIMIT_CONFIG.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset',     result.resetAt.toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSeconds));

      res.status(429).json({
        success: false,
        error: {
          code:              'RATE_LIMIT_EXCEEDED',
          message:
            `You have used all ${RATE_LIMIT_CONFIG.maxRequests} AI requests ` +
            `for this hour. Please try again in ` +
            `${Math.ceil(result.retryAfterSeconds / 60)} minute(s).`,
          retryAfterSeconds: result.retryAfterSeconds,
        },
      });
      return;
    }

    next();
  } catch (err) {
    console.error('[chatRateLimitMiddleware] DB error:', err);
    next(); // fail-open so a DB hiccup doesn't block users
  }
}

/* ─────────────────────────────────────────────────────────
   GET /api/chat/rate-limit
   Read-only status check — does NOT consume a slot.
───────────────────────────────────────────────────────── */
export async function rateLimitStatusHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = resolveUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  try {
    const status = await getRateLimitStatus(userId);
    res.json({ success: true, data: status });
  } catch (err) {
    console.error('[rateLimitStatusHandler] DB error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rate-limit status.' },
    });
  }
}