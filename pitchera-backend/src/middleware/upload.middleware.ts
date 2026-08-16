/**
 * uploadMiddleware.ts
 *
 * Multer configuration for resume file uploads.
 *
 * Security:
 * - Validates MIME type AND file extension — both must agree
 * - UUID-based filenames — originalname is NEVER used as a filesystem path
 * - Configurable size limit via MAX_RESUME_SIZE_MB env variable
 * - Rejects executables, scripts, and unsupported formats
 * - Temp files must be cleaned up by the controller after use
 */

import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// ─── Configuration ────────────────────────────────────────────────────────────

const MAX_SIZE_MB = parseInt(process.env.MAX_RESUME_SIZE_MB ?? '10', 10);
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const TEMP_DIR = path.resolve(
  process.cwd(),
  process.env.TEMP_UPLOAD_DIR ?? 'uploads/temp'
);

// Create temp directory if it does not exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ─── Allowed Types ────────────────────────────────────────────────────────────

/**
 * Maps allowed MIME types to their valid extensions.
 * Both MIME type and extension must be present and agree.
 */
const ALLOWED_MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  // Legacy DOC MIME is accepted here so multer doesn't block it at upload.
  // The extractor will return a clear DOC_NOT_SUPPORTED error downstream.
  'application/msword': ['.doc'],
};

const ALLOWED_EXTENSIONS = new Set<string>(['.pdf', '.docx', '.doc']);

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    // UUID prevents path traversal and filename collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `resume_${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const mimetype = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();

  const mimeAllowed = Object.prototype.hasOwnProperty.call(
    ALLOWED_MIME_TO_EXTENSIONS,
    mimetype
  );
  const extAllowed = ALLOWED_EXTENSIONS.has(ext);

  if (!mimeAllowed || !extAllowed) {
    return cb(
      Object.assign(new Error('INVALID_FILE_TYPE'), {
        code: 'INVALID_FILE_TYPE',
        statusCode: 400,
        userMessage:
          'Invalid file type. Please upload a PDF or DOCX file.',
      }) as unknown as null,
      false
    );
  }

  // Ensure MIME and extension agree — prevents .exe renamed to .pdf
  const validExtsForMime = ALLOWED_MIME_TO_EXTENSIONS[mimetype] ?? [];
  if (!validExtsForMime.includes(ext)) {
    return cb(
      Object.assign(new Error('MIME_EXT_MISMATCH'), {
        code: 'MIME_EXT_MISMATCH',
        statusCode: 400,
        userMessage:
          'File type mismatch. The file extension does not match its content type.',
      }) as unknown as null,
      false
    );
  }

  cb(null, true);
}

// ─── Multer Instance ──────────────────────────────────────────────────────────

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1,
  },
});

// ─── Upload Error Handler ─────────────────────────────────────────────────────

/**
 * Express error middleware for upload errors.
 * Must be placed AFTER resumeUpload.single() in the route chain.
 */
export function handleUploadError(
  err: Error & { code?: string; userMessage?: string },
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Clean up any partially written temp file
  if (req.file?.path) {
    fs.unlink(req.file.path, () => {});
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: `Resume file is too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  if (err?.code === 'INVALID_FILE_TYPE' || err?.code === 'MIME_EXT_MISMATCH') {
    res.status(400).json({
      success: false,
      message: err.userMessage ?? 'Invalid file type.',
    });
    return;
  }

  next(err);
}

export { TEMP_DIR };