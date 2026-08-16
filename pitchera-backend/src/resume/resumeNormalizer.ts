/**
 * resumeNormalizer.ts
 *
 * Normalizes raw extracted text before parsing.
 *
 * Fixes PDF extraction artifacts without modifying content:
 * - Unicode ligatures (ﬁ → fi, ﬂ → fl, etc.)
 * - Smart quotes → straight quotes
 * - Em/en dashes → hyphens
 * - Non-breaking spaces → regular spaces
 * - Windows line endings → Unix
 * - Control characters (null bytes, etc.)
 * - Excessive blank lines
 * - Trailing whitespace per line
 *
 * Does NOT:
 * - Correct spelling
 * - Change technology names
 * - Remove content
 * - Rewrite or summarize
 */

export function normalizeResumeText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // ── Remove null bytes and non-printable control characters ────────────────
  // Preserves: \n (0x0A), \r (0x0D), \t (0x09)
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // ── Fix PDF ligature extraction artifacts ─────────────────────────────────
  // These are encoding artifacts, not spelling corrections
  text = text
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬅ/g, 'st');

  // ── Normalize quotation marks ─────────────────────────────────────────────
  text = text
    .replace(/\u2018/g, "'") // left single quotation mark
    .replace(/\u2019/g, "'") // right single quotation mark
    .replace(/\u201C/g, '"') // left double quotation mark
    .replace(/\u201D/g, '"'); // right double quotation mark

  // ── Normalize dashes ──────────────────────────────────────────────────────
  text = text
    .replace(/\u2013/g, '-') // en dash
    .replace(/\u2014/g, '-'); // em dash

  // ── Normalize bullet characters to consistent bullet ─────────────────────
  text = text
    .replace(/\u25CF/g, '•') // black circle
    .replace(/\u25AA/g, '•') // black small square
    .replace(/\u2023/g, '•') // triangular bullet
    .replace(/\u2043/g, '•') // hyphen bullet
    .replace(/\u25E6/g, '•'); // white bullet

  // ── Normalize spaces ─────────────────────────────────────────────────────
  text = text.replace(/\u00A0/g, ' '); // non-breaking space

  // ── Normalize line endings ────────────────────────────────────────────────
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Collapse more than 3 consecutive blank lines to 2 ────────────────────
  text = text.replace(/\n{4,}/g, '\n\n\n');

  // ── Trim trailing whitespace on each line ─────────────────────────────────
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  text = restoreFlatResumeStructure(text);

  return text.trim();
}

const SECTION_HEADINGS = [
  'PROFILE SUMMARY',
  'PROFESSIONAL SUMMARY',
  'CAREER OBJECTIVE',
  'TECHNICAL SKILLS',
  'CORE SKILLS',
  'KEY SKILLS',
  'WORK EXPERIENCE',
  'PROFESSIONAL EXPERIENCE',
  'EMPLOYMENT HISTORY',
  'EDUCATIONAL BACKGROUND',
  'ACADEMIC BACKGROUND',
  'EDUCATION',
  'PROJECTS',
  'CERTIFICATIONS',
  'CERTIFICATES',
  'LANGUAGES',
  'SUMMARY',
  'PROFILE',
  'SKILLS',
  'EXPERIENCE',
].sort((a, b) => b.length - a.length);

const SKILL_CATEGORY_LABELS = [
  'Languages',
  'Frameworks/Libraries',
  'Frameworks',
  'Libraries',
  'Databases',
  'Tools & Platforms',
  'AI Development Tools',
  'Soft Skills',
];

function restoreFlatResumeStructure(input: string): string {
  let text = ` ${input} `;

  for (const heading of SECTION_HEADINGS) {
    text = text.replace(
      new RegExp(`(?<![A-Za-z])\\s+(${escapeRegExp(heading).replace(/\\ /g, '\\s+')})\\s+`, 'gi'),
      '\n$1\n'
    );
  }

  for (const label of SKILL_CATEGORY_LABELS) {
    text = text.replace(
      new RegExp(`\\s+(${escapeRegExp(label).replace(/\\ /g, '\\s+')})\\s+`, 'gi'),
      '\n$1: '
    );
  }

  return text
    .replace(/\s+(?=•\s+)/g, '\n')
    .replace(
      /\s+(?=[A-Z][A-Za-z&.' ]+(?:Pvt\.?\s*Ltd\.?|LLP|LLC|Inc\.?|Corp\.?|Technologies|Solutions|Systems|Services|Enterprises|Group|Studio|Labs|Consulting|Software|Infotech|Digital|Ltd)\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/g,
      '\n'
    )
    .replace(
      /\s+(?=[A-Z][A-Za-z .'-]+(?:University|College|Institute|School|Academy|Polytechnic)[A-Za-z .,'-]*\s+(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2})/g,
      '\n'
    )
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
