import fs from "fs";
import path from "path";

interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  education: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    year?: string;
  }>;
  experience: Array<{
    company?: string;
    designation?: string;
    duration?: string;
    description?: string;
  }>;
  projects: Array<{
    name?: string;
    description?: string;
    technologies?: string;
  }>;
  certifications: Array<{
    name?: string;
    organization?: string;
  }>;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export async function parseResume(filePath: string, mimeType: string): Promise<ParsedResume> {
  let text = "";

  if (mimeType === "application/pdf") {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    text = data.text;
  } else if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else {
    throw new Error("Unsupported file type for parsing");
  }

  return extractDataFromText(text);
}

function extractDataFromText(text: string): ParsedResume {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const result: ParsedResume = {
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
  };

  // Email
  const emailMatch = text.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  );
  if (emailMatch) result.email = emailMatch[0].toLowerCase();

  // Phone
  const phoneMatch = text.match(
    /(?:\+?(\d{1,3}))?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/
  );
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  // LinkedIn
  const linkedinMatch = text.match(
    /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/)([\w-]+)/i
  );
  if (linkedinMatch)
    result.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;

  // GitHub
  const githubMatch = text.match(/(?:github\.com\/)([\w-]+)/i);
  if (githubMatch) result.github = `https://github.com/${githubMatch[1]}`;

  // Portfolio
  const portfolioMatch = text.match(/(?:portfolio|website)[\s:]+([^\s]+)/i);
  if (portfolioMatch && portfolioMatch[1].includes(".")) {
    result.portfolio = portfolioMatch[1];
  }

  // Name - typically the first non-email line
  for (const line of lines.slice(0, 5)) {
    if (
      !line.includes("@") &&
      !line.match(/\d{10}/) &&
      line.length > 2 &&
      line.length < 60 &&
      !line.toLowerCase().includes("resume") &&
      !line.toLowerCase().includes("curriculum")
    ) {
      result.name = line;
      break;
    }
  }

  // Skills extraction
  const skillsSection = extractSection(text, ["skills", "technical skills", "core competencies"]);
  if (skillsSection) {
    result.skills = skillsSection
      .split(/[,|•\n\t]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 50);
  }

  // Summary
  const summarySection = extractSection(text, ["summary", "objective", "profile", "about me"]);
  if (summarySection) {
    result.summary = summarySection.substring(0, 500);
  }

  // Education
  const educationSection = extractSection(text, ["education", "academic"]);
  if (educationSection) {
    const eduLines = educationSection.split("\n").filter((l) => l.trim().length > 5);
    let currentEdu: (typeof result.education)[0] = {};

    for (const line of eduLines) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) currentEdu.year = yearMatch[0];

      if (
        line.match(
          /\b(bachelor|master|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|diploma|10th|12th|phd)\b/i
        )
      ) {
        if (Object.keys(currentEdu).length > 0) {
          result.education.push(currentEdu);
          currentEdu = {};
        }
        currentEdu.degree = line.trim();
      } else if (
        line.match(
          /\b(university|college|institute|school|iit|nit|bits)\b/i
        )
      ) {
        currentEdu.institution = line.trim();
      }
    }
    if (Object.keys(currentEdu).length > 0) {
      result.education.push(currentEdu);
    }
  }

  // Experience
  const experienceSection = extractSection(text, [
    "experience",
    "work experience",
    "employment",
    "work history",
  ]);
  if (experienceSection) {
    const expLines = experienceSection.split("\n").filter((l) => l.trim().length > 5);
    let currentExp: (typeof result.experience)[0] = {};
    let descLines: string[] = [];

    for (const line of expLines) {
      const dateRange = line.match(
        /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[\s,]+\d{4}/i
      );

      if (dateRange) {
        if (currentExp.company || currentExp.designation) {
          currentExp.description = descLines.join(" ");
          result.experience.push(currentExp);
          currentExp = {};
          descLines = [];
        }
        currentExp.duration = line.trim();
      } else if (
        line.match(
          /\b(engineer|developer|manager|analyst|designer|consultant|lead|senior|junior|intern|associate)\b/i
        )
      ) {
        currentExp.designation = line.trim();
      } else if (
        line.match(/\b(pvt|ltd|inc|corp|technologies|solutions|systems|company)\b/i) ||
        (line.length > 3 && line.length < 60 && !currentExp.company)
      ) {
        currentExp.company = line.trim();
      } else {
        descLines.push(line.trim());
      }
    }

    if (currentExp.company || currentExp.designation) {
      currentExp.description = descLines.join(" ");
      result.experience.push(currentExp);
    }
  }

  // Projects
  const projectsSection = extractSection(text, ["projects", "personal projects", "academic projects"]);
  if (projectsSection) {
    const projectLines = projectsSection.split("\n").filter((l) => l.trim().length > 5);
    let currentProject: (typeof result.projects)[0] = {};

    for (const line of projectLines) {
      if (line.match(/\b(react|node|python|java|angular|vue|django|flask)\b/i)) {
        currentProject.technologies = line;
      } else if (line.length > 5 && line.length < 80 && !currentProject.name) {
        currentProject.name = line.trim();
      } else {
        currentProject.description = (currentProject.description || "") + " " + line.trim();
      }
    }

    if (Object.keys(currentProject).length > 0) {
      result.projects.push(currentProject);
    }
  }

  // Certifications
  const certSection = extractSection(text, ["certifications", "certificates", "achievements"]);
  if (certSection) {
    const certLines = certSection.split("\n").filter((l) => l.trim().length > 5);
    for (const line of certLines) {
      if (line.match(/\b(certified|certification|certificate|aws|google|microsoft|oracle)\b/i)) {
        result.certifications.push({ name: line.trim() });
      }
    }
  }

  return result;
}

function extractSection(text: string, headings: string[]): string {
  const textLower = text.toLowerCase();

  for (const heading of headings) {
    const headingIndex = textLower.indexOf(heading);
    if (headingIndex === -1) continue;

    const nextSectionPattern =
      /\n(?:education|experience|skills|projects|certifications|summary|objective|employment|work|contact|references|achievements|awards)\s*\n/gi;

    let endIndex = text.length;
    nextSectionPattern.lastIndex = headingIndex + heading.length;

    let match;
    while ((match = nextSectionPattern.exec(text)) !== null) {
      if (match.index > headingIndex) {
        endIndex = match.index;
        break;
      }
    }

    const section = text
      .substring(headingIndex + heading.length, endIndex)
      .trim();
    if (section.length > 10) return section;
  }

  return "";
}