import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import * as profileService from "../services/profile.service";
import * as completionService from "../services/profileCompletion.service";
import * as resumeParser from "../services/resumeParser.service";
import pool from "../database/db";
import { sendSuccess, sendError } from "../utils/response";
import { ResultSetHeader } from "mysql2";
import path from "path";
import { env } from "../config/env";

export async function getProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await profileService.getFullProfile(req.user!.userId);
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
}

export async function getProfileCompletion(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const completion = await completionService.calculateProfileCompletion(
      req.user!.userId
    );
    sendSuccess(res, completion);
  } catch (error) {
    next(error);
  }
}

const basicSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional(),
  location: z.string().max(255).optional(),
});

export async function updateBasicInfo(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = basicSchema.parse(req.body);
    await profileService.updateBasicProfile(req.user!.userId, data);
    sendSuccess(res, null, "Basic info updated");
  } catch (error) {
    next(error);
  }
}

const professionalSchema = z.object({
  currentJobTitle: z.string().max(255).optional(),
  currentCompany: z.string().max(255).optional(),
  totalExperience: z.string().max(50).optional(),
  relevantExperience: z.string().max(50).optional(),
  noticePeriod: z.string().max(100).optional(),
  currentSalary: z.string().max(100).optional(),
  expectedSalary: z.string().max(100).optional(),
  preferredLocations: z.string().optional(),
  employmentType: z.string().max(100).optional(),
  summary: z.string().max(2000).optional(),
});

export async function updateProfessionalInfo(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = professionalSchema.parse(req.body);
    await profileService.updateProfessionalProfile(req.user!.userId, data);
    sendSuccess(res, null, "Professional info updated");
  } catch (error) {
    next(error);
  }
}

const socialSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
});

export async function updateSocialLinks(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = socialSchema.parse(req.body);
    await profileService.updateSocialLinks(req.user!.userId, data);
    sendSuccess(res, null, "Social links updated");
  } catch (error) {
    next(error);
  }
}

const skillsSchema = z.object({
  skills: z.array(
    z.object({
      type: z.enum(["technical", "soft", "language"]),
      name: z.string().min(1).max(255),
    })
  ),
});

export async function updateSkills(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = skillsSchema.parse(req.body);
    await profileService.replaceSkills(req.user!.userId, data.skills);
    sendSuccess(res, null, "Skills updated");
  } catch (error) {
    next(error);
  }
}

// Education CRUD
const educationSchema = z.object({
  id: z.number().optional(),
  level: z.enum(["10th", "12th", "diploma", "bachelor", "master", "other"]),
  institution: z.string().min(1).max(255),
  degree: z.string().max(255).optional(),
  fieldOfStudy: z.string().max(255).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  grade: z.string().max(50).optional(),
});

export async function upsertEducation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = educationSchema.parse(req.body);
    const id = await profileService.upsertEducation(req.user!.userId, data);
    sendSuccess(res, { id }, "Education saved");
  } catch (error) {
    next(error);
  }
}

export async function deleteEducation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await profileService.deleteEducation(req.user!.userId, parseInt(id));
    sendSuccess(res, null, "Education deleted");
  } catch (error) {
    next(error);
  }
}

// Experience CRUD
const experienceSchema = z.object({
  id: z.number().optional(),
  company: z.string().min(1).max(255),
  designation: z.string().min(1).max(255),
  startDate: z.string(),
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  technologies: z.string().max(500).optional(),
});

export async function upsertExperience(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = experienceSchema.parse(req.body);
    const id = await profileService.upsertExperience(req.user!.userId, data);
    sendSuccess(res, { id }, "Experience saved");
  } catch (error) {
    next(error);
  }
}

export async function deleteExperience(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await profileService.deleteExperience(req.user!.userId, parseInt(id));
    sendSuccess(res, null, "Experience deleted");
  } catch (error) {
    next(error);
  }
}

// Project CRUD
const projectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  technologies: z.string().max(500).optional(),
  projectUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
});

export async function upsertProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = projectSchema.parse(req.body);
    const id = await profileService.upsertProject(req.user!.userId, data);
    sendSuccess(res, { id }, "Project saved");
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await profileService.deleteProject(req.user!.userId, parseInt(id));
    sendSuccess(res, null, "Project deleted");
  } catch (error) {
    next(error);
  }
}

// Certification CRUD
const certSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(255),
  organization: z.string().min(1).max(255),
  issueDate: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal("")),
});

export async function upsertCertification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = certSchema.parse(req.body);
    const id = await profileService.upsertCertification(req.user!.userId, data);
    sendSuccess(res, { id }, "Certification saved");
  } catch (error) {
    next(error);
  }
}

export async function deleteCertification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await profileService.deleteCertification(req.user!.userId, parseInt(id));
    sendSuccess(res, null, "Certification deleted");
  } catch (error) {
    next(error);
  }
}

export async function parseResume(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { resumeId } = req.params;
    const userId = req.user!.userId;

    const [resumes] = await pool.query<any[]>(
      "SELECT * FROM resumes WHERE id = ? AND user_id = ?",
      [resumeId, userId]
    );

    if (resumes.length === 0) {
      sendError(res, "Resume not found", 404);
      return;
    }

    const resume = resumes[0];
    const parsed = await resumeParser.parseResume(
      resume.file_path,
      resume.mime_type
    );

    sendSuccess(res, parsed, "Resume parsed successfully");
  } catch (error) {
    next(error);
  }
}

export async function deleteResume(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const [resumes] = await pool.query<any[]>(
      "SELECT * FROM resumes WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (resumes.length === 0) {
      sendError(res, "Resume not found", 404);
      return;
    }

    const resume = resumes[0];
    const fs = await import("fs");
    if (fs.existsSync(resume.file_path)) {
      fs.unlinkSync(resume.file_path);
    }

    await pool.query("DELETE FROM resumes WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    sendSuccess(res, null, "Resume deleted");
  } catch (error) {
    next(error);
  }
}

export async function setPrimaryResume(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await pool.query(
      "UPDATE resumes SET is_primary = 0 WHERE user_id = ?",
      [userId]
    );

    await pool.query(
      "UPDATE resumes SET is_primary = 1 WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    sendSuccess(res, null, "Primary resume set");
  } catch (error) {
    next(error);
  }
}

export async function uploadProfilePhoto(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, "No file uploaded", 400);
      return;
    }

    const userId = req.user!.userId;
    const photoUrl = `/uploads/photos/${req.file.filename}`;

    await pool.query(
      "UPDATE profiles SET profile_photo_url = ?, updated_at = NOW() WHERE user_id = ?",
      [photoUrl, userId]
    );

    sendSuccess(res, { photoUrl }, "Profile photo uploaded");
  } catch (error) {
    next(error);
  }
}