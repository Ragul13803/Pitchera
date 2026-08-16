/**
 * docxExtractor.ts
 *
 * Extracts raw text from DOCX files using mammoth.
 *
 * mammoth is chosen because:
 * - Reliable modern DOCX support
 * - Preserves paragraphs, headings, bullets, hyperlinks, tables
 * - No native system dependencies
 * - Consistent across Node versions
 * - Already in package.json
 *
 * Legacy .doc files are NOT supported.
 * A clear DOC_NOT_SUPPORTED error is returned for .doc uploads.
 *
 * Does NOT summarize, rewrite, or modify extracted text.
 *
 * TypeScript note:
 * mammoth.Result<T> is not exported via its namespace under
 * module: commonjs + esModuleInterop: true.
 * We define the exact shape we consume to avoid TS2503.
 */

import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import type { ExtractionResult } from './pdfExtractor';

// ─── Local type for mammoth result ───────────────────────────────────────────
// mammoth.Result<T> is not accessible as a namespace type under commonjs.
// We define only the fields we actually use.

interface MammothMessage {
  type: string;
  message: string;
}

interface MammothExtractResult {
  value: string;
  messages: MammothMessage[];
}

// ─── Extractor ────────────────────────────────────────────────────────────────

export async function extractFromDOCX(filePath: string): Promise<ExtractionResult> {
  const ext = path.extname(filePath).toLowerCase();
  const warnings: string[] = [];

  // ── Legacy DOC guard ───────────────────────────────────────────────────────

  if (ext === '.doc') {
    throw Object.assign(
      new Error('Legacy DOC files are not supported. Please upload PDF or DOCX.'),
      { code: 'DOC_NOT_SUPPORTED' }
    );
  }

  // ── Read buffer ────────────────────────────────────────────────────────────

  let fileBuffer: Buffer;
  try {
    fileBuffer = fs.readFileSync(filePath);
  } catch {
    throw Object.assign(
      new Error('Could not read the uploaded file.'),
      { code: 'FILE_READ_ERROR' }
    );
  }

  // ── Extract with mammoth ───────────────────────────────────────────────────
  // Cast through unknown: mammoth.extractRawText returns a Result<string>
  // whose generic form is not accessible via the namespace under commonjs.

  let result: MammothExtractResult;
  try {
    result = (await mammoth.extractRawText({ buffer: fileBuffer })) as unknown as MammothExtractResult;
  } catch (err: unknown) {
    const error = err as Error;
    const msg = (error.message ?? '').toLowerCase();

    if (
      msg.includes('zip') ||
      msg.includes('corrupt') ||
      msg.includes('end of central') ||
      msg.includes('invalid')
    ) {
      throw Object.assign(
        new Error('The DOCX file appears to be corrupt or unreadable. Please try a different file.'),
        { code: 'DOCX_CORRUPT' }
      );
    }

    throw Object.assign(
      new Error('Failed to extract text from DOCX file.'),
      { code: 'DOCX_PARSE_ERROR' }
    );
  }

  // ── Collect mammoth messages ───────────────────────────────────────────────

  if (result.messages.length > 0) {
    const mammothWarnings = result.messages
      .filter((m: MammothMessage) => m.type === 'warning')
      .slice(0, 3)
      .map((m: MammothMessage) => m.message);
    warnings.push(...mammothWarnings);
  }

  // ── Validate content ───────────────────────────────────────────────────────

  const rawText = result.value ?? '';

  if (rawText.trim().length < 50) {
    throw Object.assign(
      new Error('The document appears to be empty or contains no extractable text.'),
      { code: 'EMPTY_DOCUMENT' }
    );
  }

  // Estimate page count — mammoth provides no page count
  // ~3000 characters per page is a reasonable approximation
  const estimatedPageCount = Math.max(1, Math.ceil(rawText.length / 3000));

  return {
    rawText,
    pages: [rawText],
    pageCount: estimatedPageCount,
    fileType: 'docx',
    warnings,
  };
}