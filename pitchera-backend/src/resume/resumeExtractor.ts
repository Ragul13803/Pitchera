/**
 * resumeExtractor.ts
 *
 * Single entry point for all resume file extraction.
 * Detects file type and delegates to the correct extractor.
 * Guarantees temp file cleanup regardless of success or failure.
 *
 * Controllers call only this module — never individual extractors.
 */

import fs from 'fs';
import path from 'path';
import { extractFromPDF, type ExtractionResult } from './pdfExtractor';
import { extractFromDOCX } from './docxExtractor';

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * @param filePath     Absolute path to the temporary uploaded file
 * @param originalName Original filename from the upload (extension detection only)
 */
export async function extractResumeText(
  filePath: string,
  originalName: string
): Promise<ExtractionResult> {
  const ext = path.extname(originalName).toLowerCase();

  let result: ExtractionResult;

  try {
    if (ext === '.pdf') {
      result = await extractFromPDF(filePath);
    } else if (ext === '.docx') {
      result = await extractFromDOCX(filePath);
    } else if (ext === '.doc') {
      throw Object.assign(
        new Error(
          'Legacy DOC files are not supported. Please upload PDF or DOCX.'
        ),
        { code: 'DOC_NOT_SUPPORTED' }
      );
    } else {
      throw Object.assign(
        new Error(
          'Unsupported file format. Please upload a PDF or DOCX file.'
        ),
        { code: 'UNSUPPORTED_FORMAT' }
      );
    }
  } finally {
    // Always clean up — even if extraction throws
    cleanupTempFile(filePath);
  }

  return result;
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Safely deletes a temporary file.
 * Never throws — only logs on unexpected failure.
 */
function cleanupTempFile(filePath: string): void {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(
        `[resumeExtractor] Failed to clean up temp file: ${filePath}`,
        err.message
      );
    }
  });
}