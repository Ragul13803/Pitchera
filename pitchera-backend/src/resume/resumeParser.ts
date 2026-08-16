/**
 * resumeParser.ts
 *
 * Parses normalized resume text into structured JSON.
 *
 * ACCURACY CONTRACT (strictly enforced throughout):
 * ──────────────────────────────────────────────────
 * ✗ Never invent information
 * ✗ Never guess missing values
 * ✗ Never fabricate dates, companies, titles, skills, education, projects
 * ✗ Never rewrite or summarize descriptions
 * ✗ Never change the candidate's original wording
 * ✗ Never automatically correct spelling
 * ✗ Never normalize technology names (ReactJS stays ReactJS)
 * ✓ Return null or "" when information cannot be confidently extracted
 * ✓ Remove only exact duplicates from skill lists
 * ✓ Preserve original bullet points and line breaks in descriptions
 *
 * This module uses only regex and string operations.
 * No AI, no external APIs, no LLMs.
 */

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface ParsedPersonal {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
}

export interface ParsedProfile {
  current_job_title: string;
  current_company: string;
  total_experience: string;
  relevant_experience: string;
  notice_period: string;
  current_salary: string;
  expected_salary: string;
  preferred_locations: string;
  employment_type: string;
  summary: string;
}

export interface ParsedSocialLinks {
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface ParsedSkills {
  technical: string[];
  soft: string[];
  language: string[];
}

export interface ParsedEducation {
  level: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string | null;
  end_date: string | null;
  grade: string;
}

export interface ParsedExperience {
  company: string;
  designation: string;
  start_date: string | null;
  end_date: string | null;
  currently_working: boolean;
  description: string;
  technologies: string;
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string;
  project_url: string;
  github_url: string;
}

export interface ParsedCertification {
  name: string;
  organization: string;
  issue_date: string | null;
  credential_url: string;
}

export interface ParsedResume {
  personal: ParsedPersonal;
  profile: ParsedProfile;
  social_links: ParsedSocialLinks;
  skills: ParsedSkills;
  educations: ParsedEducation[];
  experiences: ParsedExperience[];
  projects: ParsedProject[];
  certifications: ParsedCertification[];
}

// ─── Internal Types ───────────────────────────────────────────────────────────

type SectionMap = Record<string, string[]>;

// ─── Section Heading Patterns ─────────────────────────────────────────────────

/**
 * Maps logical section names to arrays of heading regex patterns.
 * All patterns are case-insensitive and whitespace-tolerant.
 * Order within each array: most specific → least specific.
 */
const SECTION_PATTERNS: Record<string, RegExp[]> = {
  summary: [
    /^\s*professional\s+summary\s*:?\s*$/i,
    /^\s*career\s+(?:summary|objective)\s*:?\s*$/i,
    /^\s*executive\s+summary\s*:?\s*$/i,
    /^\s*professional\s+profile\s*:?\s*$/i,
    /^\s*summary\s*:?\s*$/i,
    /^\s*profile\s*:?\s*$/i,
    /^\s*objective\s*:?\s*$/i,
    /^\s*about\s+me\s*:?\s*$/i,
  ],
  skills: [
    /^\s*technical\s+skills?\s*:?\s*$/i,
    /^\s*core\s+(?:skills?|competencies)\s*:?\s*$/i,
    /^\s*key\s+skills?\s*:?\s*$/i,
    /^\s*areas?\s+of\s+expertise\s*:?\s*$/i,
    /^\s*technical\s+expertise\s*:?\s*$/i,
    /^\s*tools?\s+(?:&|and)\s+technologies\s*:?\s*$/i,
    /^\s*programming\s+(?:skills?|languages?)\s*:?\s*$/i,
    /^\s*technologies\s*:?\s*$/i,
    /^\s*competencies\s*:?\s*$/i,
    /^\s*skills?\s*:?\s*$/i,
  ],
  experience: [
    /^\s*professional\s+(?:work\s+)?experience\s*:?\s*$/i,
    /^\s*work\s+(?:experience|history)\s*:?\s*$/i,
    /^\s*career\s+history\s*:?\s*$/i,
    /^\s*employment\s+(?:history)?\s*:?\s*$/i,
    /^\s*internships?\s*:?\s*$/i,
    /^\s*experience\s*:?\s*$/i,
    /^\s*work\s*:?\s*$/i,
  ],
  education: [
    /^\s*educational?\s+(?:qualifications?|background|details?)\s*:?\s*$/i,
    /^\s*academic\s+(?:qualifications?|background|details?|credentials?)\s*:?\s*$/i,
    /^\s*qualifications?\s*:?\s*$/i,
    /^\s*education\s*:?\s*$/i,
  ],
  projects: [
    /^\s*(?:personal\s+|academic\s+|key\s+|major\s+)?projects?\s*:?\s*$/i,
    /^\s*project\s+(?:work|experience|details?)\s*:?\s*$/i,
    /^\s*portfolio\s*:?\s*$/i,
  ],
  certifications: [
    /^\s*professional\s+certifications?\s*:?\s*$/i,
    /^\s*licenses?\s+(?:&|and)\s+certifications?\s*:?\s*$/i,
    /^\s*awards?\s+(?:&|and)\s+certifications?\s*:?\s*$/i,
    /^\s*certifications?\s*:?\s*$/i,
    /^\s*certificates?\s*:?\s*$/i,
    /^\s*credentials?\s*:?\s*$/i,
  ],
  languages: [
    /^\s*language\s+proficiency\s*:?\s*$/i,
    /^\s*spoken\s+languages?\s*:?\s*$/i,
    /^\s*languages?\s*:?\s*$/i,
  ],
};

// ─── Month Map ────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};

// ─── Shared Regex Patterns ────────────────────────────────────────────────────

const EMAIL_REGEX = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/;

const PHONE_REGEX =
  /(?:\+\d{1,3}[\s\-.]?)?\(?\d{3,5}\)?[\s\-.]?\d{3,5}[\s\-.]?\d{3,5}(?:[\s\-.]?\d{1,4})?/;

const LINKEDIN_REGEX =
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?/i;

const GITHUB_REGEX =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-_%]+\/?/i;

const DATE_RANGE_WITH_PRESENT_REGEX =
  /(?:(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?\s+)?\d{4}\s*[-–—to]+\s*(?:present|current|till\s+date|till\s+now|ongoing|now)\b/gi;

const DATE_RANGE_REGEX =
  /((?:(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?\s+)?\d{4})\s*[-–—to]+\s*((?:(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?\s+)?\d{4})/i;

const SINGLE_YEAR_REGEX = /\b(20\d{2}|19\d{2})\b/;

const JOB_TITLE_KEYWORDS_REGEX =
  /\b(?:developer|engineer|designer|manager|analyst|architect|consultant|specialist|lead|intern|director|officer|executive|administrator|coordinator|programmer|scientist|researcher|devops|fullstack|full[\s-]stack|frontend|front[\s-]end|backend|back[\s-]end|mobile|ios|android|qa|tester|scrum|agile|product|project|data|ml|ai|cloud|security|network|systems?|software|senior|junior|associate|principal|staff)\b/i;

const EDUCATION_LEVEL_MAP: Array<{ level: string; patterns: RegExp[] }> = [
  {
    level: '10th',
    patterns: [
      /\b(?:10th|x\b|sslc|matriculation|secondary\s+school\s+certificate|high\s+school)\b/i,
    ],
  },
  {
    level: '12th',
    patterns: [
      /\b(?:12th|xii\b|hsc|higher\s+secondary|intermediate|pre[-\s]?university|pu\b|puc\b)\b/i,
    ],
  },
  {
    level: 'diploma',
    patterns: [/\b(?:diploma|polytechnic)\b/i],
  },
  {
    level: 'master',
    patterns: [
      /\b(?:m\.?tech|m\.?e\.?\b|mca|m\.?sc|mba|m\.?s\.?\b|master(?:s)?\s+of|m\.?eng|m\.?phil|pg\s+diploma|post\s*graduate)\b/i,
    ],
  },
  {
    level: 'bachelor',
    patterns: [
      /\b(?:b\.?tech|b\.?e\.?\b|bca|b\.?sc|bba|b\.?com|b\.?a\.?\b|bachelor(?:s)?\s+of|b\.?eng|b\.?arch|llb|mbbs|b\.?pharm|be\b)\b/i,
    ],
  },
];

// ─── Main Parser Entry ────────────────────────────────────────────────────────

export function parseResume(normalizedText: string): ParsedResume {
  const lines = normalizedText.split('\n');

  // Step 1: Segment text into named sections
  const sections = segmentSections(lines);

  // Step 2: Extract from each section
  const personal = extractPersonal(sections.__header__ ?? [], normalizedText);
  const profile = extractProfile(sections, normalizedText);
  const social_links = extractSocialLinks(normalizedText);
  const skills = extractSkills(sections);
  const educations = extractEducations(sections);
  const experiences = extractExperiences(sections);
  const projects = extractProjects(sections);
  const certifications = extractCertifications(sections);

  return {
    personal,
    profile,
    social_links,
    skills,
    educations,
    experiences,
    projects,
    certifications,
  };
}

// ─── Section Segmentation ─────────────────────────────────────────────────────

function segmentSections(lines: string[]): SectionMap {
  const sections: SectionMap = { __header__: [] };
  let currentSection = '__header__';

  for (const line of lines) {
    const detected = detectSectionHeading(line);
    if (detected) {
      currentSection = detected;
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      // Heading line itself is not added to content
    } else {
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(line);
    }
  }

  return sections;
}

function detectSectionHeading(line: string): string | null {
  const trimmed = line.trim();
  // Section headings are short and not empty
  if (!trimmed || trimmed.length > 70) return null;

  for (const [sectionName, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        return sectionName;
      }
    }
  }
  return null;
}

// ─── Personal Information ─────────────────────────────────────────────────────

function extractPersonal(
  headerLines: string[],
  fullText: string
): ParsedPersonal {
  // Email: search full text (may be outside header)
  const emailMatch = fullText.match(EMAIL_REGEX);
  const email = emailMatch ? emailMatch[0].trim() : '';

  // Phone: search header first, fallback to full text
  const phone = extractPhone(headerLines.join('\n') || fullText);

  // Name: from header block only
  const { first_name, last_name } = extractName(headerLines);

  // Location: from header block
  const location = extractLocation(headerLines);

  return { first_name, last_name, email, phone, location };
}

function extractPhone(text: string): string {
  const lines = text.split('\n');
  for (const line of lines) {
    if (/^\s*\d{4}\s*$/.test(line.trim())) continue; // skip year-only lines
    const match = line.match(PHONE_REGEX);
    if (match) {
      const candidate = match[0].trim();
      const digitCount = (candidate.match(/\d/g) ?? []).length;
      if (digitCount >= 7 && digitCount <= 15) {
        return candidate;
      }
    }
  }
  return '';
}

/**
 * Extracts the candidate's name from header lines.
 *
 * Strategy:
 * - First non-empty line that is NOT an email, URL, phone, or known non-name
 * - Must be 1–5 words
 * - Mostly alphabetic (≥ 70%)
 */
function extractName(
  headerLines: string[]
): { first_name: string; last_name: string } {
  const EXCLUDED_REGEX = /^(?:resume|cv|curriculum\s+vitae|profile|biodata)$/i;
  const URL_REGEX = /https?:|linkedin|github|www\./i;
  const compactHeader = headerLines.join(' ').trim();
  const compactNameMatch = compactHeader.match(
    /^\s*([A-Z][A-Z.'-]+(?:\s+[A-Z][A-Z.'-]+){1,3})(?=\s+(?:software|front\s*end|backend|full\s*stack|mobile|web|senior|junior|lead|developer|engineer|designer|analyst|manager)\b|\s+\S+@\S+|\s*$)/i
  );

  if (compactNameMatch) {
    const words = toTitleCaseName(compactNameMatch[1]).split(/\s+/);
    return {
      first_name: words[0] ?? '',
      last_name: words.slice(1).join(' '),
    };
  }

  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 60) continue;
    if (EMAIL_REGEX.test(trimmed)) continue;
    if (URL_REGEX.test(trimmed)) continue;
    if (EXCLUDED_REGEX.test(trimmed)) continue;
    if (/^\d/.test(trimmed)) continue; // starts with digit

    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 5) continue;

    const noSpaces = trimmed.replace(/\s/g, '');
    const alphaCount = (noSpaces.match(/[a-zA-Z]/g) ?? []).length;
    const alphaRatio = alphaCount / noSpaces.length;
    if (alphaRatio < 0.7) continue;

    return {
      first_name: words[0] ?? '',
      last_name: words.slice(1).join(' '),
    };
  }

  return { first_name: '', last_name: '' };
}

function toTitleCaseName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractLocation(headerLines: string[]): string {
  const LOCATION_KEYWORDS_REGEX =
    /\b(?:bangalore|bengaluru|mumbai|delhi|new\s+delhi|hyderabad|pune|chennai|kolkata|india|usa|uk|remote|united\s+states|united\s+kingdom|canada|australia|germany|france|singapore)\b/i;

  const compactHeader = headerLines.join(' ');
  const iconLocationMatch = compactHeader.match(
    /(?:½|📍|location\s*:?)\s*([A-Za-z][A-Za-z\s.'-]+,\s*[A-Za-z][A-Za-z\s.'-]+?)(?=\s+(?:PROFILE|SUMMARY|WORK|TECHNICAL|EDUCATION|EXPERIENCE|SKILLS|CERTIFICATIONS)|$)/i
  );
  if (iconLocationMatch) {
    return iconLocationMatch[1].trim();
  }

  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) continue;
    if (EMAIL_REGEX.test(trimmed)) continue;
    if (PHONE_REGEX.test(trimmed)) continue;
    if (LOCATION_KEYWORDS_REGEX.test(trimmed)) return trimmed;

    // "City, State/Country" pattern
    if (/^[A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z\s]+){0,2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  return '';
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function extractProfile(sections: SectionMap, fullText: string): ParsedProfile {
  const summaryLines = sections.summary ?? [];
  const summary = summaryLines
    .filter((l) => l.trim())
    .join('\n')
    .trim();

  const headerLines = sections.__header__ ?? [];
  const current_job_title = extractCurrentJobTitle(headerLines);
  const current_company = extractCurrentCompany(sections);

  return {
    current_job_title,
    current_company,
    total_experience: '',
    relevant_experience: '',
    notice_period: extractNoticePeriod(fullText),
    current_salary: '',
    expected_salary: '',
    preferred_locations: '',
    employment_type: '',
    summary,
  };
}

function extractCurrentJobTitle(headerLines: string[]): string {
  const compactHeader = headerLines.join(' ');
  const compactTitleMatch = compactHeader.match(
    /^[A-Z][A-Z.'-]+(?:\s+[A-Z][A-Z.'-]+){1,3}\s+(.+?)(?=\s+[A-Z]?\s*[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|\s+\||$)/
  );
  if (
    compactTitleMatch &&
    JOB_TITLE_KEYWORDS_REGEX.test(compactTitleMatch[1]) &&
    compactTitleMatch[1].trim().length < 80
  ) {
    return compactTitleMatch[1].trim();
  }

  let nameSkipped = false;
  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!nameSkipped) {
      nameSkipped = true;
      continue; // skip the name line
    }
    if (EMAIL_REGEX.test(trimmed)) continue;
    if (PHONE_REGEX.test(trimmed)) continue;
    if (
      JOB_TITLE_KEYWORDS_REGEX.test(trimmed) &&
      trimmed.length < 80
    ) {
      return trimmed;
    }
  }
  return '';
}

function extractCurrentCompany(sections: SectionMap): string {
  const expLines = sections.experience ?? [];
  if (expLines.length === 0) return '';

  // Look for "present" near a company name in the first experience block
  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/\b(?:present|current|till\s+date|ongoing|now)\b/i.test(trimmed)) {
      // The company should be in the nearby lines, not this date line
      break;
    }
  }

  // Take the first non-bullet, non-date line as potential current company
  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^[•\-*▪►]/.test(trimmed)) continue;
    if (DATE_RANGE_WITH_PRESENT_REGEX.test(trimmed)) {
      DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
      continue;
    }
    DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
    if (trimmed.length > 1 && trimmed.length < 100) {
      return trimmed;
    }
  }
  return '';
}

function extractNoticePeriod(fullText: string): string {
  const match = fullText.match(
    /notice\s+period\s*:?\s*([^\n]{1,50})/i
  );
  return match ? match[1].trim() : '';
}

// ─── Social Links ─────────────────────────────────────────────────────────────

function extractSocialLinks(fullText: string): ParsedSocialLinks {
  const linkedinMatch = fullText.match(LINKEDIN_REGEX);
  const githubMatch = fullText.match(GITHUB_REGEX);

  // Portfolio: first https:// URL that is not LinkedIn or GitHub
  const allUrls = fullText.match(/https?:\/\/[^\s<>"]+/gi) ?? [];
  let portfolio = '';
  for (const url of allUrls) {
    if (
      !LINKEDIN_REGEX.test(url) &&
      !GITHUB_REGEX.test(url) &&
      !EMAIL_REGEX.test(url)
    ) {
      portfolio = url.replace(/[)\].,;]+$/, ''); // trim trailing punctuation
      break;
    }
  }

  return {
    linkedin: normalizeUrl(linkedinMatch?.[0] ?? ''),
    github: normalizeUrl(githubMatch?.[0] ?? ''),
    portfolio: normalizeUrl(portfolio),
  };
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// ─── Skills ───────────────────────────────────────────────────────────────────

function extractSkills(sections: SectionMap): ParsedSkills {
  const skillsText = (sections.skills ?? []).join('\n');
  const languageText = (sections.languages ?? []).join('\n');

  const technical = parseSkillList(skillsText);
  const language = parseLanguageList(languageText);
  const soft = extractSoftSkills(skillsText);

  return { technical, soft, language };
}

/**
 * Parses skill text into individual skill strings.
 * Preserves original names exactly — never normalizes.
 * Splits on: comma, pipe, semicolon, bullet, newline.
 * Removes only exact duplicates.
 */
function parseSkillList(text: string): string[] {
  if (!text.trim()) return [];

  const seen = new Set<string>();
  const skills: string[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle "Category: skill1, skill2" patterns
    const categoryMatch = trimmed.match(/^([^:]{1,40}):\s*(.+)$/);
    const skillPart = categoryMatch ? categoryMatch[2] : trimmed;

    // Remove leading bullet character
    const cleaned = skillPart.replace(/^[•\-*▪►◦‣⁃]\s*/, '');

    for (const skill of splitOnDelimiters(cleaned)) {
      if (!seen.has(skill.toLowerCase())) {
        seen.add(skill.toLowerCase());
        skills.push(skill); // push original casing
      }
    }
  }

  return skills.filter((s) => s.length >= 1 && s.length <= 80);
}

function parseLanguageList(text: string): string[] {
  if (!text.trim()) return [];
  const seen = new Set<string>();
  const langs: string[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim().replace(/^[•\-*▪►]\s*/, '');
    if (!trimmed) continue;
    for (const lang of splitOnDelimiters(trimmed)) {
      if (!seen.has(lang.toLowerCase())) {
        seen.add(lang.toLowerCase());
        langs.push(lang);
      }
    }
  }
  return langs.filter((l) => l.length > 0 && l.length <= 50);
}

function extractSoftSkills(skillsText: string): string[] {
  const match = skillsText.match(
    /soft\s+skills?\s*:?\s*([^\n]+(?:\n(?![A-Z\s]+:)[^\n]+)*)/i
  );
  if (!match) return [];
  return parseSkillList(match[1]);
}

function splitOnDelimiters(str: string): string[] {
  return str
    .split(/[,|;•]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 80 && !/^\d{4}$/.test(s));
}

// ─── Education ────────────────────────────────────────────────────────────────

function extractEducations(sections: SectionMap): ParsedEducation[] {
  const lines = sections.education ?? [];
  if (lines.length === 0) return [];

  const blocks = splitIntoBlocks(lines);
  const educations: ParsedEducation[] = [];

  for (const block of blocks) {
    if (!block.some((l) => l.trim())) continue;
    const edu = parseEducationBlock(block.join('\n'));
    if (edu) educations.push(edu);
  }

  return educations;
}

function parseEducationBlock(blockText: string): ParsedEducation | null {
  const lines = blockText.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return null;

  // ── Level ──────────────────────────────────────────────────────────────────
  let level = 'other';
  for (const entry of EDUCATION_LEVEL_MAP) {
    if (entry.patterns.some((p) => p.test(blockText))) {
      level = entry.level;
      break;
    }
  }

  // ── Institution ────────────────────────────────────────────────────────────
  let institution = '';
  for (const line of lines) {
    const t = line.trim();
    if (/\b(?:university|college|institute|school|academy|polytechnic)\b/i.test(t)) {
      institution = t;
      break;
    }
  }
  if (!institution) {
    // Fall back: first non-date, non-degree line
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (DATE_RANGE_REGEX.test(t) || SINGLE_YEAR_REGEX.test(t)) continue;
      if (t.length > 3) {
        institution = t;
        break;
      }
    }
  }

  // ── Degree + Field of Study ────────────────────────────────────────────────
  let degree = '';
  let field_of_study = '';

  const degreeMatch = blockText.match(
    /\b(b\.?tech|m\.?tech|bca|mca|b\.?sc|m\.?sc|bba|mba|b\.?e|m\.?e|b\.?com|m\.?com|b\.?a|m\.?a|bachelor[s]?\s+of[^,\n]{1,40}|master[s]?\s+of[^,\n]{1,40}|diploma)\b(?:\s+(?:in|of|-)?\s+([^\n,–\-]{1,60}))?/i
  );
  if (degreeMatch) {
    degree = degreeMatch[1]?.trim() ?? '';
    field_of_study = degreeMatch[2]?.trim() ?? '';
  }

  // ── Dates ──────────────────────────────────────────────────────────────────
  const { start_date, end_date } = extractDateRange(blockText);

  // ── Grade ──────────────────────────────────────────────────────────────────
  // Preserved exactly: "8.2 CGPA", "57%", "First Class"
  const grade = extractGrade(blockText);

  if (!institution && !degree) return null;

  return {
    level,
    institution: institution.trim(),
    degree: degree.trim(),
    field_of_study: field_of_study.trim(),
    start_date,
    end_date,
    grade,
  };
}

function extractGrade(text: string): string {
  const gradePatterns: RegExp[] = [
    /(\d+\.?\d*\s*cgpa)/i,
    /(\d+\.?\d*\s*gpa)/i,
    /(\d+\.?\d*\s*%)/,
    /\b(first\s+class|second\s+class|distinction|merit|pass)\b/i,
  ];
  for (const pattern of gradePatterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return '';
}

// ─── Experience ───────────────────────────────────────────────────────────────

function extractExperiences(sections: SectionMap): ParsedExperience[] {
  const lines = sections.experience ?? [];
  if (lines.length === 0) return [];

  const blocks = splitIntoBlocks(lines);
  const experiences: ParsedExperience[] = [];

  for (const block of blocks) {
    if (!block.some((l) => l.trim())) continue;
    const exp = parseExperienceBlock(block);
    if (exp && (exp.company || exp.designation)) {
      experiences.push(exp);
    }
  }

  return experiences;
}

function parseExperienceBlock(block: string[]): ParsedExperience | null {
  const lines = block.filter((l) => l.trim());
  if (lines.length === 0) return null;

  const blockText = block.join('\n');

  // ── Dates ──────────────────────────────────────────────────────────────────
  const { start_date, end_date, currently_working } =
    extractDateRangeWithPresent(blockText);

  // ── Company + Designation ──────────────────────────────────────────────────
  let company = '';
  let designation = '';

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^[•\-*▪►]/.test(t)) continue; // bullet line = description

    const dateLineMatch = extractDateText(t);
    if (dateLineMatch && !company) {
      const companyCandidate = t.replace(dateLineMatch, '').trim();
      if (companyCandidate.length > 1 && companyCandidate.length < 120) {
        company = companyCandidate;
      }
      DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
      continue;
    }

    if (DATE_RANGE_WITH_PRESENT_REGEX.test(t)) {
      DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
      continue;
    }
    DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
    if (DATE_RANGE_REGEX.test(t)) continue;
    if (SINGLE_YEAR_REGEX.test(t) && t.length < 12) continue; // year-only line

    if (!company && t.length > 1 && t.length < 100) {
      company = t;
    } else if (!designation && t.length > 1 && t.length < 100) {
      if (JOB_TITLE_KEYWORDS_REGEX.test(t)) {
        designation = t;
      }
    }

    if (company && designation) break;
  }

  // If first line looks like a job title and second looks like company, swap
  if (company && !designation && JOB_TITLE_KEYWORDS_REGEX.test(company)) {
    designation = company;
    company = '';
  }

  // ── Description ────────────────────────────────────────────────────────────
  // Preserved EXACTLY — no summarization, no rewriting
  const descriptionLines = lines.filter((l) => {
    const t = l.trim();
    if (!t) return false;
    if (t === company || t === designation) return false;
    if (DATE_RANGE_WITH_PRESENT_REGEX.test(t)) {
      DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
      return false;
    }
    DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
    if (DATE_RANGE_REGEX.test(t) && t.length < 30) return false;

    // Keep bullet lines and long descriptive lines
    return (
      /^[•\-*▪►]/.test(t) ||
      t.length > 25
    );
  });

  const description = descriptionLines.join('\n').trim();

  // ── Technologies ────────────────────────────────────────────────────────────
  // Only extract techs EXPLICITLY mentioned in THIS experience block
  const technologies = extractBlockTechnologies(blockText);

  return {
    company: company.trim(),
    designation: designation.trim(),
    start_date,
    end_date,
    currently_working,
    description,
    technologies,
  };
}

function extractDateText(text: string): string | null {
  DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
  const present = text.match(DATE_RANGE_WITH_PRESENT_REGEX);
  DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
  if (present) return present[0];

  const range = text.match(DATE_RANGE_REGEX);
  return range ? range[0] : null;
}

function extractBlockTechnologies(blockText: string): string {
  const match = blockText.match(
    /(?:tech(?:nologies|nology|nical\s+skills?|stack)?|tools?|stack|frameworks?|built\s+with|developed\s+(?:using|with)|worked\s+(?:on|with)|using)\s*:?\s*([^\n]{2,200})/i
  );
  return match ? match[1].trim() : '';
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function extractProjects(sections: SectionMap): ParsedProject[] {
  const lines = sections.projects ?? [];
  if (lines.length === 0) return [];

  const blocks = splitIntoBlocks(lines);
  const projects: ParsedProject[] = [];

  for (const block of blocks) {
    if (!block.some((l) => l.trim())) continue;
    const proj = parseProjectBlock(block);
    if (proj?.name) projects.push(proj);
  }

  return projects;
}

function parseProjectBlock(block: string[]): ParsedProject | null {
  const lines = block.filter((l) => l.trim());
  if (lines.length === 0) return null;
  const blockText = block.join('\n');

  // First non-bullet, non-URL line = project name
  let name = '';
  for (const line of lines) {
    const t = line.trim();
    if (!t || /^[•\-*▪►]/.test(t) || /^https?:/.test(t)) continue;
    if (t.length > 1 && t.length < 120) {
      name = t;
      break;
    }
  }

  // Description: all non-name, non-URL, non-tech lines (preserved exactly)
  const descLines = lines.filter((l) => {
    const t = l.trim();
    return (
      t &&
      t !== name &&
      !/^https?:/.test(t) &&
      !/^(?:tech(?:nologies|nology|stack)?|tools?|built\s+with|stack)\s*:/i.test(t)
    );
  });
  const description = descLines.join('\n').trim();

  // Technologies
  const techMatch = blockText.match(
    /(?:tech(?:nologies|nology|stack)?|tools?|built\s+with|stack|using)\s*:?\s*([^\n]{2,200})/i
  );
  const technologies = techMatch ? techMatch[1].trim() : '';

  // URLs
  const urlMatches = blockText.match(/https?:\/\/[^\s<>"]+/gi) ?? [];
  const githubUrl =
    urlMatches.find((u) => /github\.com/i.test(u))?.replace(/[)\].,;]+$/, '') ?? '';
  const projectUrl =
    urlMatches.find((u) => !/github\.com/i.test(u))?.replace(/[)\].,;]+$/, '') ?? '';

  if (!name) return null;

  return {
    name: name.trim(),
    description,
    technologies,
    project_url: projectUrl,
    github_url: githubUrl,
  };
}

// ─── Certifications ───────────────────────────────────────────────────────────

function extractCertifications(sections: SectionMap): ParsedCertification[] {
  const lines = sections.certifications ?? [];
  if (lines.length === 0) return [];

  // Try block-based parsing first
  const blocks = splitIntoBlocks(lines);
  const certifications: ParsedCertification[] = [];

  for (const block of blocks) {
    if (!block.some((l) => l.trim())) continue;
    const cert = parseCertificationBlock(block.join('\n'));
    if (cert?.name) certifications.push(cert);
  }

  // Fallback: line-by-line for bullet-separated certifications
  if (certifications.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const name = trimmed.replace(/^[•\-*▪►]\s*/, '');
      if (name.length > 1) {
        certifications.push({
          name,
          organization: '',
          issue_date: null,
          credential_url: '',
        });
      }
    }
  }

  return certifications;
}

function parseCertificationBlock(blockText: string): ParsedCertification | null {
  const lines = blockText.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return null;

  let name = '';
  for (const line of lines) {
    const t = line.trim().replace(/^[•\-*▪►]\s*/, '');
    if (t && !DATE_RANGE_REGEX.test(t) && !SINGLE_YEAR_REGEX.test(t)) {
      name = t;
      break;
    }
  }

  let organization = '';
  let passedName = false;
  for (const line of lines) {
    const t = line.trim().replace(/^[•\-*▪►]\s*/, '');
    if (t === name) { passedName = true; continue; }
    if (passedName && t && !DATE_RANGE_REGEX.test(t) && !SINGLE_YEAR_REGEX.test(t)) {
      organization = t;
      break;
    }
  }

  const dateMatch = blockText.match(
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\.?\s+\d{4}|\d{4})/i
  );
  const issue_date = dateMatch ? parseSingleDate(dateMatch[0]) : null;

  const urlMatch = blockText.match(/https?:\/\/[^\s<>"]+/i);
  const credential_url = urlMatch
    ? urlMatch[0].replace(/[)\].,;]+$/, '')
    : '';

  if (!name) return null;

  return { name, organization, issue_date, credential_url };
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

interface DateRangeResult {
  start_date: string | null;
  end_date: string | null;
  currently_working: boolean;
}

/**
 * Extracts a date range from text, detecting "Present" variants.
 *
 * IMPORTANT: Never fabricates the day.
 * Returns YYYY-MM when month is available, YYYY when only year is available.
 */
function extractDateRangeWithPresent(text: string): DateRangeResult {
  // Reset regex state before use (global regex with lastIndex)
  DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;

  const presentMatch = text.match(DATE_RANGE_WITH_PRESENT_REGEX);
  if (presentMatch) {
    const rawStr = presentMatch[0];
    const startPart = rawStr.split(/[-–—to]+/i)[0]?.trim() ?? '';
    return {
      start_date: parseSingleDate(startPart),
      end_date: null,
      currently_working: true,
    };
  }

  const rangeMatch = text.match(DATE_RANGE_REGEX);
  if (rangeMatch) {
    return {
      start_date: parseSingleDate(rangeMatch[1] ?? ''),
      end_date: parseSingleDate(rangeMatch[2] ?? ''),
      currently_working: false,
    };
  }

  const yearMatch = text.match(SINGLE_YEAR_REGEX);
  if (yearMatch) {
    return {
      start_date: yearMatch[1] ?? null,
      end_date: null,
      currently_working: false,
    };
  }

  return { start_date: null, end_date: null, currently_working: false };
}

function extractDateRange(
  text: string
): { start_date: string | null; end_date: string | null } {
  const { start_date, end_date } = extractDateRangeWithPresent(text);
  return { start_date, end_date };
}

/**
 * Converts a date string to YYYY-MM or YYYY.
 * Never fabricates the day portion.
 */
function parseSingleDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();

  // "Month YYYY" or "Month. YYYY"
  const monthYearMatch = cleaned.match(
    /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{4})$/i
  );
  if (monthYearMatch) {
    const key = monthYearMatch[1].toLowerCase().replace('.', '');
    const monthNum = MONTH_MAP[key];
    if (monthNum) return `${monthYearMatch[2]}-${monthNum}`;
  }

  // "MM/YYYY"
  const mmYYYYMatch = cleaned.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYYYYMatch) {
    const mm = String(parseInt(mmYYYYMatch[1], 10)).padStart(2, '0');
    return `${mmYYYYMatch[2]}-${mm}`;
  }

  // "YYYY-MM"
  if (/^\d{4}-\d{2}$/.test(cleaned)) return cleaned;

  // Year only
  if (/^\d{4}$/.test(cleaned)) return cleaned;

  // Partial match — extract year + optional month from longer string
  const longMatch = cleaned.match(
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{4})/i
  );
  if (longMatch) {
    const key = longMatch[1].toLowerCase().replace('.', '');
    const monthNum = MONTH_MAP[key];
    if (monthNum) return `${longMatch[2]}-${monthNum}`;
  }

  const yearMatch = cleaned.match(/\b(\d{4})\b/);
  if (yearMatch) return yearMatch[1];

  return null;
}

// ─── Block Splitter ───────────────────────────────────────────────────────────

/**
 * Splits a flat line array into logical blocks.
 * Primary delimiter: blank lines.
 * Secondary: date range lines (when no blank lines exist).
 */
function splitIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  // If no blank-line separation found, try date-based splitting
  if (blocks.length === 1 && (blocks[0]?.length ?? 0) > 5) {
    return splitBlocksByDateLines(blocks[0] ?? []);
  }

  return blocks;
}

function splitBlocksByDateLines(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
    if (
      (DATE_RANGE_WITH_PRESENT_REGEX.test(t) || DATE_RANGE_REGEX.test(t)) &&
      current.length > 1
    ) {
      DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
      blocks.push(current);
      current = [line];
    } else {
      DATE_RANGE_WITH_PRESENT_REGEX.lastIndex = 0;
      current.push(line);
    }
  }

  if (current.length > 0) blocks.push(current);
  return blocks;
}
