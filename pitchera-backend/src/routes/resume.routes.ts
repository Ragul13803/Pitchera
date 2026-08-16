/**
 * resume.routes.ts
 *
 * Registers: POST /api/resume/extract
 *
 * Uses the existing auth middleware (auth.middleware.ts) — not duplicated.
 * Uses the resume-specific upload middleware (upload.middleware.ts) for
 * MIME + extension validation on the extract endpoint.
 *
 * The existing profile routes continue to use upload.ts (upload.middleware)
 * for resume storage — that is not changed here.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware'; // ← existing auth middleware
import { resumeUpload, handleUploadError } from '../middleware/upload.middleware';
import { extractResume } from '../controllers/resume.controller';

const router = Router();

/**
 * POST /api/resume/extract
 *
 * Flow:
 * 1. authenticate    — existing JWT middleware (reused, not duplicated)
 * 2. resumeUpload    — multer with MIME + extension + size validation
 * 3. handleUploadError — multer-specific error handler
 * 4. extractResume   — controller (no DB writes)
 */
router.post(
  '/extract',
  authenticate,
  resumeUpload.single('resume'),
  handleUploadError,
  extractResume
);

export default router;