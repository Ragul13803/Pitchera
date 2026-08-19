// src/jobs/cleanupJob.ts
import cron                           from 'node-cron';
import { cleanupOldRateLimitEntries } from '../services/rateLimit.service';

/**
 * Run every hour at :05 to delete stale rate-limit rows.
 * Call startCleanupJob() from your server.ts after DB connects.
 */
export function startCleanupJob(): void {
  cron.schedule('5 * * * *', async () => {
    try {
      await cleanupOldRateLimitEntries();
      console.log('[CleanupJob] Old rate-limit entries removed.');
    } catch (err) {
      console.error('[CleanupJob] Error:', err);
    }
  });

  console.log('✅ Chat cleanup job scheduled (every hour at :05)');
}