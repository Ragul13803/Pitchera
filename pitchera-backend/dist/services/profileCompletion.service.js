"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProfileCompletion = calculateProfileCompletion;
const db_1 = __importDefault(require("../database/db"));
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
async function calculateProfileCompletion(userId) {
    const [[user]] = await db_1.default.query(`SELECT u.first_name, u.last_name, u.email,
            p.phone, p.location, p.profile_photo_url,
            p.current_job_title, p.current_company, p.total_experience,
            p.relevant_experience, p.notice_period, p.employment_type,
            p.summary
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`, [userId]);
    const [[social]] = await db_1.default.query("SELECT linkedin, github, portfolio FROM social_links WHERE user_id = ?", [userId]);
    const [skills] = await db_1.default.query("SELECT COUNT(*) as count FROM skills WHERE user_id = ?", [userId]);
    const [educations] = await db_1.default.query("SELECT COUNT(*) as count FROM educations WHERE user_id = ?", [userId]);
    const [experiences] = await db_1.default.query("SELECT COUNT(*) as count FROM experiences WHERE user_id = ?", [userId]);
    const [projects] = await db_1.default.query("SELECT COUNT(*) as count FROM projects WHERE user_id = ?", [userId]);
    const [certifications] = await db_1.default.query("SELECT COUNT(*) as count FROM certifications WHERE user_id = ?", [userId]);
    const [resumes] = await db_1.default.query("SELECT COUNT(*) as count FROM resumes WHERE user_id = ?", [userId]);
    const sections = {
        basic: !!(user?.first_name && user?.last_name),
        professional: !!(user?.current_job_title &&
            user?.current_company &&
            user?.total_experience),
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
        return total + (completed ? WEIGHTS[key] : 0);
    }, 0);
    return {
        percentage,
        sections,
        weights: WEIGHTS,
    };
}
//# sourceMappingURL=profileCompletion.service.js.map