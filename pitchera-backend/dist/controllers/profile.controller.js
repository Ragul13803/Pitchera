"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.getProfileCompletion = getProfileCompletion;
exports.updateBasicInfo = updateBasicInfo;
exports.updateProfessionalInfo = updateProfessionalInfo;
exports.updateSocialLinks = updateSocialLinks;
exports.updateSkills = updateSkills;
exports.upsertEducation = upsertEducation;
exports.deleteEducation = deleteEducation;
exports.upsertExperience = upsertExperience;
exports.deleteExperience = deleteExperience;
exports.upsertProject = upsertProject;
exports.deleteProject = deleteProject;
exports.upsertCertification = upsertCertification;
exports.deleteCertification = deleteCertification;
exports.uploadResume = uploadResume;
exports.parseResume = parseResume;
exports.deleteResume = deleteResume;
exports.setPrimaryResume = setPrimaryResume;
exports.uploadProfilePhoto = uploadProfilePhoto;
const zod_1 = require("zod");
const profileService = __importStar(require("../services/profile.service"));
const completionService = __importStar(require("../services/profileCompletion.service"));
const resumeParser = __importStar(require("../services/resumeParser.service"));
const db_1 = __importDefault(require("../database/db"));
const response_1 = require("../utils/response");
async function getProfile(req, res, next) {
    try {
        const profile = await profileService.getFullProfile(req.user.userId);
        (0, response_1.sendSuccess)(res, profile);
    }
    catch (error) {
        next(error);
    }
}
async function getProfileCompletion(req, res, next) {
    try {
        const completion = await completionService.calculateProfileCompletion(req.user.userId);
        (0, response_1.sendSuccess)(res, completion);
    }
    catch (error) {
        next(error);
    }
}
const basicSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).trim(),
    lastName: zod_1.z.string().min(1).max(100).trim(),
    phone: zod_1.z.string().max(20).optional(),
    location: zod_1.z.string().max(255).optional(),
});
async function updateBasicInfo(req, res, next) {
    try {
        const data = basicSchema.parse(req.body);
        await profileService.updateBasicProfile(req.user.userId, data);
        (0, response_1.sendSuccess)(res, null, "Basic info updated");
    }
    catch (error) {
        next(error);
    }
}
const professionalSchema = zod_1.z.object({
    currentJobTitle: zod_1.z.string().max(255).optional(),
    currentCompany: zod_1.z.string().max(255).optional(),
    totalExperience: zod_1.z.string().max(50).optional(),
    relevantExperience: zod_1.z.string().max(50).optional(),
    noticePeriod: zod_1.z.string().max(100).optional(),
    currentSalary: zod_1.z.string().max(100).optional(),
    expectedSalary: zod_1.z.string().max(100).optional(),
    preferredLocations: zod_1.z.string().optional(),
    employmentType: zod_1.z.string().max(100).optional(),
    summary: zod_1.z.string().max(2000).optional(),
});
async function updateProfessionalInfo(req, res, next) {
    try {
        const data = professionalSchema.parse(req.body);
        await profileService.updateProfessionalProfile(req.user.userId, data);
        (0, response_1.sendSuccess)(res, null, "Professional info updated");
    }
    catch (error) {
        next(error);
    }
}
const socialSchema = zod_1.z.object({
    linkedin: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    github: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    portfolio: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
async function updateSocialLinks(req, res, next) {
    try {
        const data = socialSchema.parse(req.body);
        await profileService.updateSocialLinks(req.user.userId, data);
        (0, response_1.sendSuccess)(res, null, "Social links updated");
    }
    catch (error) {
        next(error);
    }
}
const skillsSchema = zod_1.z.object({
    skills: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(["technical", "soft", "language"]),
        name: zod_1.z.string().min(1).max(255),
    })),
});
async function updateSkills(req, res, next) {
    try {
        const data = skillsSchema.parse(req.body);
        await profileService.replaceSkills(req.user.userId, data.skills);
        (0, response_1.sendSuccess)(res, null, "Skills updated");
    }
    catch (error) {
        next(error);
    }
}
// Education CRUD
const educationSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    level: zod_1.z.enum(["10th", "12th", "diploma", "bachelor", "master", "other"]),
    institution: zod_1.z.string().min(1).max(255),
    degree: zod_1.z.string().max(255).optional(),
    fieldOfStudy: zod_1.z.string().max(255).optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    grade: zod_1.z.string().max(50).optional(),
});
async function upsertEducation(req, res, next) {
    try {
        const data = educationSchema.parse(req.body);
        const id = await profileService.upsertEducation(req.user.userId, data);
        (0, response_1.sendSuccess)(res, { id }, "Education saved");
    }
    catch (error) {
        next(error);
    }
}
async function deleteEducation(req, res, next) {
    try {
        const { id } = req.params;
        await profileService.deleteEducation(req.user.userId, parseInt(id));
        (0, response_1.sendSuccess)(res, null, "Education deleted");
    }
    catch (error) {
        next(error);
    }
}
// Experience CRUD
const experienceSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    company: zod_1.z.string().min(1).max(255),
    designation: zod_1.z.string().min(1).max(255),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
    currentlyWorking: zod_1.z.boolean().default(false),
    description: zod_1.z.string().max(2000).optional(),
    technologies: zod_1.z.string().max(500).optional(),
});
async function upsertExperience(req, res, next) {
    try {
        const data = experienceSchema.parse(req.body);
        const id = await profileService.upsertExperience(req.user.userId, data);
        (0, response_1.sendSuccess)(res, { id }, "Experience saved");
    }
    catch (error) {
        next(error);
    }
}
async function deleteExperience(req, res, next) {
    try {
        const { id } = req.params;
        await profileService.deleteExperience(req.user.userId, parseInt(id));
        (0, response_1.sendSuccess)(res, null, "Experience deleted");
    }
    catch (error) {
        next(error);
    }
}
// Project CRUD
const projectSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().max(2000).optional(),
    technologies: zod_1.z.string().max(500).optional(),
    projectUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    githubUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
async function upsertProject(req, res, next) {
    try {
        const data = projectSchema.parse(req.body);
        const id = await profileService.upsertProject(req.user.userId, data);
        (0, response_1.sendSuccess)(res, { id }, "Project saved");
    }
    catch (error) {
        next(error);
    }
}
async function deleteProject(req, res, next) {
    try {
        const { id } = req.params;
        await profileService.deleteProject(req.user.userId, parseInt(id));
        (0, response_1.sendSuccess)(res, null, "Project deleted");
    }
    catch (error) {
        next(error);
    }
}
// Certification CRUD
const certSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    name: zod_1.z.string().min(1).max(255),
    organization: zod_1.z.string().min(1).max(255),
    issueDate: zod_1.z.string().optional(),
    credentialUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
async function upsertCertification(req, res, next) {
    try {
        const data = certSchema.parse(req.body);
        const id = await profileService.upsertCertification(req.user.userId, data);
        (0, response_1.sendSuccess)(res, { id }, "Certification saved");
    }
    catch (error) {
        next(error);
    }
}
async function deleteCertification(req, res, next) {
    try {
        const { id } = req.params;
        await profileService.deleteCertification(req.user.userId, parseInt(id));
        (0, response_1.sendSuccess)(res, null, "Certification deleted");
    }
    catch (error) {
        next(error);
    }
}
// Resume upload
async function uploadResume(req, res, next) {
    try {
        if (!req.file) {
            (0, response_1.sendError)(res, "No file uploaded", 400);
            return;
        }
        const userId = req.user.userId;
        const file = req.file;
        // Set as non-primary first, then set this one as primary
        await db_1.default.query("UPDATE resumes SET is_primary = 0 WHERE user_id = ?", [userId]);
        const [result] = await db_1.default.query(`INSERT INTO resumes (user_id, original_filename, stored_filename, file_path, file_size, mime_type, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, 1)`, [
            userId,
            file.originalname,
            file.filename,
            file.path,
            file.size,
            file.mimetype,
        ]);
        (0, response_1.sendSuccess)(res, {
            id: result.insertId,
            originalFilename: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            isPrimary: true,
        }, "Resume uploaded successfully", 201);
    }
    catch (error) {
        next(error);
    }
}
async function parseResume(req, res, next) {
    try {
        const { resumeId } = req.params;
        const userId = req.user.userId;
        const [resumes] = await db_1.default.query("SELECT * FROM resumes WHERE id = ? AND user_id = ?", [resumeId, userId]);
        if (resumes.length === 0) {
            (0, response_1.sendError)(res, "Resume not found", 404);
            return;
        }
        const resume = resumes[0];
        const parsed = await resumeParser.parseResume(resume.file_path, resume.mime_type);
        (0, response_1.sendSuccess)(res, parsed, "Resume parsed successfully");
    }
    catch (error) {
        next(error);
    }
}
async function deleteResume(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const [resumes] = await db_1.default.query("SELECT * FROM resumes WHERE id = ? AND user_id = ?", [id, userId]);
        if (resumes.length === 0) {
            (0, response_1.sendError)(res, "Resume not found", 404);
            return;
        }
        const resume = resumes[0];
        const fs = await Promise.resolve().then(() => __importStar(require("fs")));
        if (fs.existsSync(resume.file_path)) {
            fs.unlinkSync(resume.file_path);
        }
        await db_1.default.query("DELETE FROM resumes WHERE id = ? AND user_id = ?", [
            id,
            userId,
        ]);
        (0, response_1.sendSuccess)(res, null, "Resume deleted");
    }
    catch (error) {
        next(error);
    }
}
async function setPrimaryResume(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await db_1.default.query("UPDATE resumes SET is_primary = 0 WHERE user_id = ?", [userId]);
        await db_1.default.query("UPDATE resumes SET is_primary = 1 WHERE id = ? AND user_id = ?", [id, userId]);
        (0, response_1.sendSuccess)(res, null, "Primary resume set");
    }
    catch (error) {
        next(error);
    }
}
async function uploadProfilePhoto(req, res, next) {
    try {
        if (!req.file) {
            (0, response_1.sendError)(res, "No file uploaded", 400);
            return;
        }
        const userId = req.user.userId;
        const photoUrl = `/uploads/photos/${req.file.filename}`;
        await db_1.default.query("UPDATE profiles SET profile_photo_url = ?, updated_at = NOW() WHERE user_id = ?", [photoUrl, userId]);
        (0, response_1.sendSuccess)(res, { photoUrl }, "Profile photo uploaded");
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=profile.controller.js.map