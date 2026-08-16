/**
 * pdfExtractor.ts
 *
 * Extracts raw text from PDF files using pdf-parse.
 *
 * Handles:
 * - Single-page and multi-page PDFs
 * - Password-protected PDFs (detected, rejected with clear error)
 * - Scanned/image-only PDFs (detected, rejected with clear error)
 * - Corrupt PDFs (caught, rejected with clear error)
 * - Two-column layout detection (warning added, content preserved)
 *
 * Does NOT use AI, external APIs, or OCR.
 * Does NOT summarize, rewrite, or modify the extracted text.
 * Returns raw text exactly as the PDF content stream presents it.
 *
 * Layout note:
 * pdf-parse does not provide reliable spatial column information.
 * Text is extracted in PDF content stream order.
 * For complex two-column layouts this may cause interleaving.
 * A warning is added to the response when this is detected.
 */

import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractionResult {
  rawText: string;
  pages: string[];
  pageCount: number;
  fileType: string;
  warnings: string[];
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** Below this character count we treat the PDF as scanned/image-based */
const MIN_TEXT_LENGTH = 50;

/** Below this average chars-per-page on multi-page docs we warn about scanning */
const MIN_CHARS_PER_PAGE = 100;

// ─── Extractor ────────────────────────────────────────────────────────────────

export async function extractFromPDF(filePath: string): Promise<ExtractionResult> {
  // Dynamic require to work around pdf-parse CJS/ESM interop issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse') as (
    buffer: Buffer,
    options?: Record<string, unknown>
  ) => Promise<{ text: string; numpages: number }>;

  const warnings: string[] = [];

  // ── Read buffer ────────────────────────────────────────────────────────────

  let dataBuffer: Buffer;
  try {
    dataBuffer = fs.readFileSync(filePath);
  } catch {
    throw Object.assign(new Error('Could not read the uploaded file.'), {
      code: 'FILE_READ_ERROR',
    });
  }

  // ── Parse PDF ─────────────────────────────────────────────────────────────

  let parsed: { text: string; numpages: number };

  try {
    /**
     * pdf-parse renders all pages into a single text string.
     * We use a custom pagerender to capture per-page content.
     */
    const pageTexts: string[] = [];

    const options = {
      // pagerender is called once per page with the pdf.js page object
      pagerender: async (pageData: {
        getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
      }): Promise<string> => {
        try {
          const content = await pageData.getTextContent();
          const text = content.items.map((item) => item.str).join(' ');
          pageTexts.push(text);
          return text;
        } catch {
          pageTexts.push('');
          return '';
        }
      },
    };

    parsed = await pdfParse(dataBuffer, options);

    // ── Scanned PDF detection ────────────────────────────────────────────────

    const textLength = (parsed.text ?? '').trim().length;
    const pageCount = parsed.numpages ?? 1;

    if (textLength < MIN_TEXT_LENGTH) {
      throw Object.assign(
        new Error(
          'This resume appears to be scanned/image-based. Text could not be extracted.'
        ),
        { code: 'SCANNED_PDF' }
      );
    }

    const avgCharsPerPage = textLength / pageCount;
    if (pageCount > 1 && avgCharsPerPage < MIN_CHARS_PER_PAGE) {
      warnings.push(
        'This PDF may contain scanned pages. Some content may not have been extracted.'
      );
    }

    // ── Two-column layout heuristic ──────────────────────────────────────────

    const lines = (parsed.text ?? '').split('\n').filter((l) => l.trim());
    if (lines.length > 10) {
      const shortLines = lines.filter((l) => l.trim().length < 15).length;
      const shortRatio = shortLines / lines.length;
      if (shortRatio > 0.4) {
        warnings.push(
          'Some PDF layout information could not be reliably reconstructed. ' +
            'If the resume has multiple columns, please review the extracted fields carefully.'
        );
      }
    }

    // ── Build pages array ───────────────────────────────────────────────────

    const pages =
      pageTexts.length > 0
        ? pageTexts
        : splitIntoPages(parsed.text ?? '', pageCount);

    return {
      rawText: parsed.text ?? '',
      pages,
      pageCount,
      fileType: 'pdf',
      warnings,
    };
  } catch (err: unknown) {
    const error = err as Error & { code?: string };

    // Re-throw known codes unchanged
    if (error.code === 'SCANNED_PDF' || error.code === 'FILE_READ_ERROR') {
      throw err;
    }

    // Password-protected PDF detection
    const msg = (error.message ?? '').toLowerCase();
    if (
      msg.includes('password') ||
      msg.includes('encrypted') ||
      msg.includes('bad xref') ||
      msg.includes('bad signature')
    ) {
      throw Object.assign(
        new Error(
          'This PDF is password-protected. Please upload an unprotected version.'
        ),
        { code: 'PDF_PROTECTED' }
      );
    }

    // Corrupt PDF
    throw Object.assign(
      new Error(
        'The PDF file appears to be corrupt or unreadable. Please try a different file.'
      ),
      { code: 'PDF_CORRUPT' }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits a full text string into approximately equal page chunks.
 * Used as a fallback when per-page rendering is unavailable.
 */
function splitIntoPages(text: string, pageCount: number): string[] {
  if (pageCount <= 1) return [text];
  const chunkSize = Math.ceil(text.length / pageCount);
  const pages: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push(text.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  return pages;
}