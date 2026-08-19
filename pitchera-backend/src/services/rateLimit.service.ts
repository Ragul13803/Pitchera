// src/services/rateLimitService.ts
import pool                from '../database/db';
import { RATE_LIMIT_CONFIG } from '../config/rateLimit';
import { RateLimitRow }    from '../types/chat.types';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

/** Returns the current hour truncated to :00:00 in UTC */
function getWindowStart(): string {
  const now = new Date();
  // Zero out minutes / seconds / ms
  now.setUTCMinutes(0, 0, 0);
  // Format as MySQL DATETIME  →  "YYYY-MM-DD HH:00:00"
  return now.toISOString().slice(0, 19).replace('T', ' ');
}

/** ISO string of windowStart + 1 hour */
function getResetAt(windowStart: string): Date {
  const d = new Date(`${windowStart.replace(' ', 'T')}Z`);
  d.setUTCHours(d.getUTCHours() + 1);
  return d;
}

/* ─────────────────────────────────────────────────────────
   checkAndConsumeRateLimit
   Returns allowed = true  → slot consumed
   Returns allowed = false → limit already reached
───────────────────────────────────────────────────────── */
export async function checkAndConsumeRateLimit(userId: number): Promise<
  | { allowed: true;  remaining: number; resetAt: Date }
  | { allowed: false; remaining: 0;      resetAt: Date; retryAfterSeconds: number }
> {
  const windowStart        = getWindowStart();
  const resetAt            = getResetAt(windowStart);
  const { maxRequests }    = RATE_LIMIT_CONFIG;
  const conn               = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* ── INSERT or ignore if the row already exists ── */
    await conn.execute<ResultSetHeader>(
      `INSERT INTO chat_rate_limits (user_id, window_start, request_count)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE id = id`,   // no-op on conflict
      [userId, windowStart],
    );

    /* ── Lock the row for this user + window ── */
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT id, request_count
       FROM   chat_rate_limits
       WHERE  user_id = ? AND window_start = ?
       FOR UPDATE`,
      [userId, windowStart],
    );

    const row          = rows[0] as Pick<RateLimitRow, 'id' | 'request_count'>;
    const currentCount = row.request_count;

    /* ── Already at limit? ── */
    if (currentCount >= maxRequests) {
      await conn.rollback();
      const retryAfterSeconds = Math.ceil(
        (resetAt.getTime() - Date.now()) / 1000,
      );
      return { allowed: false, remaining: 0, resetAt, retryAfterSeconds };
    }

    /* ── Increment ── */
    await conn.execute<ResultSetHeader>(
      `UPDATE chat_rate_limits
       SET    request_count = request_count + 1
       WHERE  id = ?`,
      [row.id],
    );

    await conn.commit();

    const remaining = maxRequests - (currentCount + 1);
    return { allowed: true, remaining, resetAt };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ─────────────────────────────────────────────────────────
   getRateLimitStatus  (read-only, does NOT consume a slot)
───────────────────────────────────────────────────────── */
export async function getRateLimitStatus(userId: number): Promise<{
  limit:     number;
  used:      number;
  remaining: number;
  resetAt:   string;
}> {
  const windowStart     = getWindowStart();
  const resetAt         = getResetAt(windowStart);
  const { maxRequests } = RATE_LIMIT_CONFIG;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT request_count
     FROM   chat_rate_limits
     WHERE  user_id = ? AND window_start = ?`,
    [userId, windowStart],
  );

  const used      = rows.length ? (rows[0] as any).request_count as number : 0;
  const remaining = Math.max(0, maxRequests - used);

  return {
    limit: maxRequests,
    used,
    remaining,
    resetAt: resetAt.toISOString(),
  };
}

/* ─────────────────────────────────────────────────────────
   cleanupOldEntries
   Call from a scheduled job (e.g. every hour via node-cron).
   Deletes rows whose window_start is older than 2 hours.
───────────────────────────────────────────────────────── */
export async function cleanupOldRateLimitEntries(): Promise<void> {
  await pool.execute(
    `DELETE FROM chat_rate_limits
     WHERE window_start < DATE_SUB(NOW(), INTERVAL 2 HOUR)`,
  );
}