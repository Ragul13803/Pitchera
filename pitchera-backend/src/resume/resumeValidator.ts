/**
 * resumeValidator.ts
 *
 * Post-parse validation of extracted fields.
 * Removes values that fail format validation.
 * Collects warnings for the API response.
 *
 * Never modifies values that pass validation.
 * Never invents replacement values.
 */

import type { ParsedResume } from './resumeParser';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const URL_REGEX = /^https?:\/\/.+/;
const DATE_REGEX = /^\d{4}(?:-\d{2})?$/;

export interface ValidationResult extends ParsedResume {
  _validationWarnings: string[];
}

export function validateAndScore(parsed: ParsedResume): ValidationResult {
  const warnings: string[] = [];

  // ── Personal ────────────────────────────────────────────────────────────────

  const personal = { ...parsed.personal };
  if (personal.email && !EMAIL_REGEX.test(personal.email)) {
    warnings.push('Extracted email may be invalid. Please verify.');
    personal.email = '';
  }

  // ── Social Links ────────────────────────────────────────────────────────────

  const social_links = { ...parsed.social_links };
  if (social_links.linkedin && !URL_REGEX.test(social_links.linkedin)) {
    social_links.linkedin = '';
  }
  if (social_links.github && !URL_REGEX.test(social_links.github)) {
    social_links.github = '';
  }
  if (social_links.portfolio && !URL_REGEX.test(social_links.portfolio)) {
    social_links.portfolio = '';
  }

  // ── Experiences ─────────────────────────────────────────────────────────────

  const experiences = parsed.experiences.map((exp) => {
    const validated = { ...exp };
    if (validated.end_date && !DATE_REGEX.test(validated.end_date)) {
      validated.end_date = null;
    }
    if (validated.start_date && !DATE_REGEX.test(validated.start_date)) {
      validated.start_date = null;
    }
    return validated;
  });

  // ── Educations ──────────────────────────────────────────────────────────────

  const educations = parsed.educations.map((edu) => {
    const validated = { ...edu };
    if (validated.start_date && !DATE_REGEX.test(validated.start_date)) {
      validated.start_date = null;
    }
    if (validated.end_date && !DATE_REGEX.test(validated.end_date)) {
      validated.end_date = null;
    }
    return validated;
  });

  // ── Certifications ──────────────────────────────────────────────────────────

  const certifications = parsed.certifications.map((cert) => {
    const validated = { ...cert };
    if (validated.credential_url && !URL_REGEX.test(validated.credential_url)) {
      validated.credential_url = '';
    }
    if (validated.issue_date && !DATE_REGEX.test(validated.issue_date)) {
      validated.issue_date = null;
    }
    return validated;
  });

  return {
    ...parsed,
    personal,
    social_links,
    experiences,
    educations,
    certifications,
    _validationWarnings: warnings,
  };
}