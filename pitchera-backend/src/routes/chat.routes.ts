// src/routes/chatRoutes.ts
import { Router }                        from 'express';
import { authenticate } from "../middleware/auth.middleware";
import { getChatHistory, sendChatMessage } from '../controllers/chat.controller';
import { rateLimitStatusHandler, chatRateLimitMiddleware } from '../middleware/chatRateLimit.middleware';

const router = Router();

/* All chat routes require a valid JWT */
router.use(authenticate);

/* GET  /api/chat/rate-limit  →  read-only quota check (no slot consumed) */
router.get('/rate-limit', rateLimitStatusHandler);

/* GET  /api/chat/history     →  fetch past messages */
router.get('/history', getChatHistory);

/* POST /api/chat/send        →  send message  (5 req / hr per user) */
router.post('/send', chatRateLimitMiddleware, sendChatMessage);

export default router;