// src/config/rateLimit.ts

export const RATE_LIMIT_CONFIG = {
  /** Maximum requests allowed per user */
  maxRequests: 5,
  /** Window in milliseconds (1 hour) */
  windowMs: 60 * 60 * 1000,
  /** Key prefix for in-memory fallback */
  prefix: 'pitchera-chat',
};