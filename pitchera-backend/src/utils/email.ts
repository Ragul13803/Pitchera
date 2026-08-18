// src/utils/email.util.ts

/**
 * Smart salutation for "Dear X," in email body.
 *
 * Priority:
 *  1. Name typed in form → first name only
 *  2. Generic HR email (careers@, hr@) → "Hiring Team"
 *  3. Personal-looking email (john.doe@) → "Sir/Madam"
 *  4. Fallback → "Team"
 */
export function getSmartSalutation(
  name: string | null | undefined,
  email: string
): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/)[0];
  }

  const emailPrefix = email.trim().toLowerCase().split("@")[0];

  const genericPrefixes = [
    "careers", "career", "hr", "humanresources", "human-resources",
    "jobs", "job", "recruit", "recruiting", "recruitment", "recruiter",
    "hiring", "hiringteam", "talent", "talentacquisition",
    "apply", "applications", "application", "info", "information",
    "contact", "contactus", "hello", "hi", "team", "support",
    "admin", "work", "opportunity", "opportunities", "staffing",
    "people", "peopleops", "resume", "resumes", "cv",
    "noreply", "no-reply", "donotreply",
  ];

  const isGeneric = genericPrefixes.some(
    (p) =>
      emailPrefix === p ||
      emailPrefix.startsWith(p + ".") ||
      emailPrefix.startsWith(p + "_") ||
      emailPrefix.startsWith(p + "-")
  );

  if (isGeneric) return "Hiring Team";

  const looksLikePerson = /^[a-z]+([._-][a-z]+)*\d{0,4}$/.test(emailPrefix);
  if (looksLikePerson) return "Sir/Madam";

  return "Team";
}