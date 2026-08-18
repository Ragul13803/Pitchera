// src/utils/email.util.ts

/**
 * Smart salutation for "Dear X," in email body {{recruiterName}}
 *
 * Priority:
 *  1. Name typed in form → first name only  e.g. "John Smith" → "John"
 *  2. Generic HR email (careers@, hr@)      → "Hiring Team"
 *  3. Personal-looking email (john.doe@)    → "Sir/Madam"
 *  4. Absolute fallback                     → "Team"
 */
export function getSmartSalutation(
  name: string | null | undefined,
  email: string
): string {
  // 1. Name provided → use first name only
  if (name && name.trim()) {
    return name.trim().split(/\s+/)[0];
  }

  const emailPrefix = email.trim().toLowerCase().split("@")[0];

  // 2. Generic / role-based → Hiring Team
  const genericPrefixes = [
    "careers", "career",
    "hr", "humanresources", "human-resources", "human_resources",
    "jobs", "job",
    "recruit", "recruiting", "recruitment", "recruiter",
    "hiring", "hiringteam", "hiring-team", "hiring_team",
    "talent", "talentacquisition", "talent-acquisition",
    "apply", "applications", "application",
    "info", "information",
    "contact", "contactus", "contact-us",
    "hello", "hi",
    "team",
    "support",
    "admin",
    "work",
    "opportunity", "opportunities",
    "staffing",
    "people", "peopleops", "people-ops",
    "resume", "resumes", "cv",
    "noreply", "no-reply", "no_reply", "donotreply", "do-not-reply",
  ];

  const isGeneric = genericPrefixes.some(
    (p) =>
      emailPrefix === p ||
      emailPrefix.startsWith(p + ".") ||
      emailPrefix.startsWith(p + "_") ||
      emailPrefix.startsWith(p + "-")
  );

  if (isGeneric) return "Hiring Team";

  // 3. Looks like a person's name → Sir/Madam
  const looksLikePerson = /^[a-z]+([._-][a-z]+)*\d{0,4}$/.test(emailPrefix);
  if (looksLikePerson) return "Sir/Madam";

  // 4. Fallback
  return "Team";
}