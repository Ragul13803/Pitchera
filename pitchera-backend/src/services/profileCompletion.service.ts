import { RowDataPacket } from "mysql2";
import pool from "../database/db";

interface CompletionResult {
  percentage: number;
  sections: {
    basic: boolean;
    professional: boolean;
    contact: boolean;
    skills: boolean;
    education: boolean;
    experience: boolean;
    projects: boolean;
    certifications: boolean;
    socialLinks: boolean;
    resume: boolean;
  };
  weights: {
    basic: number;
    professional: number;
    contact: number;
    skills: number;
    education: number;
    experience: number;
    projects: number;
    certifications: number;
    socialLinks: number;
    resume: number;
  };
}

const WEIGHTS = {
  basic: 15,
  professional: 15,
  contact: 10,
  skills: 15,
  education: 15,
  experience: 10,
  projects: 5,
  certifications: 5,
  socialLinks: 5,
  resume: 5,
};

export async function calculateProfileCompletion(
  userId: number
): Promise<CompletionResult> {
  const [[user]] = await pool.query<RowDataPacket[]>(
    `SELECT u.first_name, u.last_name, u.email,
            p.phone, p.location, p.profile_photo_url,
            p.current_job_title, p.current_company, p.total_experience,
            p.relevant_experience, p.notice_period, p.employment_type,
            p.summary
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );

  const [[social]] = await pool.query<RowDataPacket[]>(
    "SELECT linkedin, github, portfolio FROM social_links WHERE user_id = ?",
    [userId]
  );

  const [skills] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM skills WHERE user_id = ?",
    [userId]
  );

  const [educations] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM educations WHERE user_id = ?",
    [userId]
  );

  const [experiences] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM experiences WHERE user_id = ?",
    [userId]
  );

  const [projects] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM projects WHERE user_id = ?",
    [userId]
  );

  const [certifications] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM certifications WHERE user_id = ?",
    [userId]
  );

  const [resumes] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM resumes WHERE user_id = ?",
    [userId]
  );

  const sections = {
    basic: !!(user?.first_name && user?.last_name),
    professional: !!(
      user?.current_job_title &&
      user?.current_company &&
      user?.total_experience
    ),
    contact: !!(user?.phone && user?.location),
    skills: (skills[0]?.count || 0) >= 3,
    education: (educations[0]?.count || 0) > 0,
    experience: (experiences[0]?.count || 0) > 0,
    projects: (projects[0]?.count || 0) > 0,
    certifications: (certifications[0]?.count || 0) > 0,
    socialLinks: !!(social?.linkedin || social?.github || social?.portfolio),
    resume: (resumes[0]?.count || 0) > 0,
  };

  const percentage = Object.entries(sections).reduce((total, [key, completed]) => {
    return total + (completed ? WEIGHTS[key as keyof typeof WEIGHTS] : 0);
  }, 0);

  return {
    percentage,
    sections,
    weights: WEIGHTS,
  };
}