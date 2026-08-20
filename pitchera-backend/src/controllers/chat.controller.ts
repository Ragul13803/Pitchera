// src/controllers/chatController.ts
import { Request, Response }          from 'express';
import { ChatRequest }                from '../types/chat.types';
import { NVIDIA_CONFIG }              from '../config/nvidia';
import { appendMessages, getHistory } from '../services/chatHistory.service';
import { performGoogleSearch } from '../services/googleSearch.service';
import { callNvidiaModel } from '../services/nvidia.service';

/* ─────────────────────────────────────────────────────────
   Helper: integer user ID from req.user
───────────────────────────────────────────────────────── */
function resolveUserId(req: Request): number | null {
  const u   = (req as any).user;
  if (!u) return null;
  const raw = u.id ?? u.userId ?? u.user_id ?? u.sub;
  const n   = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/* ─────────────────────────────────────────────────────────
   POST /api/chat/send
───────────────────────────────────────────────────────── */
export async function sendChatMessage(
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

  const { mode, message, history = [], userProfile } =
    req.body as ChatRequest;

  /* ── Validation ── */
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_MESSAGE', message: 'message field is required.' },
    });
    return;
  }

  if (!['ai', 'google'].includes(mode)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_MODE', message: 'mode must be "ai" or "google".' },
    });
    return;
  }

  /* ── Call AI service ──
     Explicit routing: the backend decides the flow from `mode`, never the
     model. Google mode gets its own web-search pipeline and is NOT given
     the AI-mode conversation history — a prior AI-mode reply like "I only
     support your job search..." must never leak into a Google-mode call. */
  try {
    if (mode === 'google') {
      console.log(`[chatController] google mode request: userId=${userId} query="${message.trim()}"`);
      const result = await performGoogleSearch(message.trim());
      console.log(
        `[chatController] google mode result: type=${result.type} ` +
          `sources=${'sources' in result ? result.sources.length : 'n/a'} ` +
          `jobs=${'jobs' in result ? result.jobs.length : 'n/a'}`,
      );

      appendMessages(userId, message.trim(), result.answer, mode).catch((err) =>
        console.error('[chatController] Failed to persist chat history:', err),
      );

      res.json({
        success: true,
        data: { ...result, model: NVIDIA_CONFIG.model },
      });
      return;
    }

    const result = await callNvidiaModel(mode, message.trim(), history, userProfile);

    appendMessages(userId, message.trim(), result.reply, mode).catch((err) =>
      console.error('[chatController] Failed to persist chat history:', err),
    );

    res.json({
      success: true,
      data: {
        reply: result.reply,
        model: NVIDIA_CONFIG.model,
        usage: result.usage,
      },
    });
  } catch (err: any) {
    console.error(
      `[chatController] sendChatMessage error (mode=${mode}, code=${err.code ?? 'n/a'}):`,
      err.message,
      err.cause ? `| cause: ${err.cause.message}` : '',
    );

    if (err.code === 'SEARCH_BLOCKED' || err.code === 'SEARCH_NETWORK_ERROR' || err.code === 'SEARCH_HTTP_ERROR') {
      res.status(502).json({
        success: false,
        error: {
          code: err.code,
          message:
            'Web search is temporarily unavailable (the search provider blocked or rejected the request). ' +
            'Please try again shortly.',
        },
      });
      return;
    }

    if (err.status === 429) {
      res.status(429).json({
        success: false,
        error: {
          code:    'NVIDIA_RATE_LIMIT',
          message: 'AI provider is rate-limited. Please try again shortly.',
        },
      });
      return;
    }

    if (err.name === 'AbortError') {
      res.status(504).json({
        success: false,
        error: { code: 'TIMEOUT', message: 'Request timed out. Please try again.' },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
    });
  }
}

/* ─────────────────────────────────────────────────────────
   GET /api/chat/history
───────────────────────────────────────────────────────── */
export async function getChatHistory(
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

  const limit = Math.min(
    parseInt((req.query.limit as string) || '50', 10),
    100,
  );

  try {
    const messages = await getHistory(userId, limit);
    res.json({ success: true, data: { messages } });
  } catch (err) {
    console.error('[chatController] getChatHistory error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch chat history.' },
    });
  }
}