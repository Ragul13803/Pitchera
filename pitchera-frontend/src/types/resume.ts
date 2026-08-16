/**
 * types/resume.ts
 *
 * Single source of truth for resume extraction types.
 * These MUST match the backend API response exactly.
 */

// ─── Extracted Data (matches backend ParsedResume) ───────────────────────────

export interface ExtractedPersonal {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
}

export interface ExtractedProfile {
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

export interface ExtractedSocialLinks {
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface ExtractedSkills {
  technical: string[];
  soft: string[];
  language: string[];
}

export interface ExtractedEducation {
  level: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string | null;
  end_date: string | null;
  grade: string;
}

export interface ExtractedExperience {
  company: string;
  designation: string;
  start_date: string | null;
  end_date: string | null;
  currently_working: boolean;
  description: string;
  technologies: string;
}

export interface ExtractedProject {
  name: string;
  description: string;
  technologies: string;
  project_url: string;
  github_url: string;
}

export interface ExtractedCertification {
  name: string;
  organization: string;
  issue_date: string | null;
  credential_url: string;
}

export interface ExtractedResumeData {
  personal: ExtractedPersonal;
  profile: ExtractedProfile;
  social_links: ExtractedSocialLinks;
  skills: ExtractedSkills;
  educations: ExtractedEducation[];
  experiences: ExtractedExperience[];
  projects: ExtractedProject[];
  certifications: ExtractedCertification[];
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ResumeExtractionMetadata {
  fileName: string;
  fileType: string;
  pageCount: number;
  warnings: string[];
}

export interface ResumeExtractionResponse {
  success: boolean;
  data: ExtractedResumeData;
  metadata: ResumeExtractionMetadata;
  message?: string;
}

// ─── Service Result ──────────────────────────────────────────────────────────

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedResumeData;
  metadata?: ResumeExtractionMetadata;
  error?: string;
  cancelled?: boolean;
}

// ─── Education Level (matches DB enum) ───────────────────────────────────────

export const EDUCATION_LEVELS = [
  '10th',
  '12th',
  'diploma',
  'bachelor',
  'master',
  'other',
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

/**
 * Safely coerces an arbitrary string to a valid EducationLevel.
 * Falls back to "other" — never guesses.
 */
export function toEducationLevel(value: string): EducationLevel {
  const normalized = value.trim().toLowerCase();
  return (EDUCATION_LEVELS as readonly string[]).includes(normalized)
    ? (normalized as EducationLevel)
    : 'other';
}