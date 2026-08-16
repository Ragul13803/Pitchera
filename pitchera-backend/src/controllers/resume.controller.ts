/**
 * resume.controller.ts
 *
 * Handles POST /api/resume/extract
 *
 * Responsibilities:
 * - Receive uploaded file from multer
 * - Orchestrate extraction → normalization → parsing → validation
 * - Return structured JSON response
 * - Map known error codes to user-friendly messages
 * - Never expose stack traces, file paths, or internal errors
 * - Never write to the database from this endpoint
 *
 * No extraction or parsing logic lives here.
 * All business logic is in the services layer.
 */

import type { Request, Response } from 'express';
import { extractResumeText } from '../resume/resumeExtractor';
import { normalizeResumeText } from '../resume/resumeNormalizer';
import { parseResume } from '../resume/resumeParser';          // ← was wrongly pointing to profile.controller
import { validateAndScore } from '../resume/resumeValidator';

// ─── Error Code → Response Map ────────────────────────────────────────────────

interface ErrorResponse {
  status: number;
  message: string;
}

const KNOWN_ERROR_CODES: Record<string, ErrorResponse> = {
  SCANNED_PDF: {
    status: 422,
    message:
      'This resume appears to be scanned/image-based. Text could not be extracted. Please upload a text-based PDF or DOCX.',
  },
  PDF_PROTECTED: {
    status: 422,
    message:
      'This PDF is password-protected. Please upload an unprotected version.',
  },
  PDF_CORRUPT: {
    status: 422,
    message:
      'The PDF file appears to be corrupt or unreadable. Please try a different file.',
  },
  DOCX_CORRUPT: {
    status: 422,
    message:
      'The DOCX file appears to be corrupt or unreadable. Please try a different file.',
  },
  DOCX_PARSE_ERROR: {
    status: 422,
    message: 'Failed to read the DOCX file. Please try a different file.',
  },
  DOC_NOT_SUPPORTED: {
    status: 415,
    message:
      'Legacy DOC files are not supported. Please upload PDF or DOCX.',
  },
  EMPTY_DOCUMENT: {
    status: 422,
    message:
      'The document appears to be empty or contains no extractable text.',
  },
  UNSUPPORTED_FORMAT: {
    status: 415,
    message: 'Unsupported file format. Please upload a PDF or DOCX file.',
  },
  FILE_READ_ERROR: {
    status: 500,
    message: 'Could not read the uploaded file. Please try again.',
  },
  DEPENDENCY_MISSING: {
    status: 500,
    message: 'Server configuration error. Please contact support.',
  },
};

// ─── Controller ───────────────────────────────────────────────────────────────

export async function extractResume(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message:
        'No resume file was uploaded. Please select a PDF or DOCX file.',
    });
    return;
  }

  const { path: filePath, originalname, mimetype } = req.file;

  try {
    // ── Step 1: Extract raw text ─────────────────────────────────────────────
    const extraction = await extractResumeText(filePath, originalname);

    const {
      rawText,
      pageCount,
      fileType,
      warnings: extractionWarnings,
    } = extraction;

    // ── Step 2: Normalize ────────────────────────────────────────────────────
    const normalizedText = normalizeResumeText(rawText);

    // ── Step 3: Parse ────────────────────────────────────────────────────────
    const parsed = parseResume(normalizedText);

    // ── Step 4: Validate ─────────────────────────────────────────────────────
    const validated = validateAndScore(parsed);
    const validationWarnings = validated._validationWarnings;

    // Remove internal field before sending response
    const { _validationWarnings, ...responseData } = validated;
    void _validationWarnings; // consumed above

    const allWarnings = [...extractionWarnings, ...validationWarnings];

    // ── Step 5: Respond ──────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        personal: responseData.personal,
        profile: responseData.profile,
        social_links: responseData.social_links,
        skills: responseData.skills,
        educations: responseData.educations,
        experiences: responseData.experiences,
        projects: responseData.projects,
        certifications: responseData.certifications,
      },
      metadata: {
        fileName: originalname,
        fileType,
        pageCount,
        warnings: allWarnings,
      },
    });
  } catch (err: unknown) {
    const error = err as Error & { code?: string };

    // Map known error codes to user-friendly responses
    if (error.code && KNOWN_ERROR_CODES[error.code]) {
      const { status, message } = KNOWN_ERROR_CODES[error.code];
      res.status(status).json({ success: false, message });
      return;
    }

    // Unknown error — log internally, never expose internals
    console.error('[resumeController] Unexpected extraction error:', {
      code: error.code,
      message: error.message,
      file: originalname,
      mimetype,
    });

    res.status(500).json({
      success: false,
      message:
        'An unexpected error occurred while processing your resume. Please try again.',
    });
  }
}