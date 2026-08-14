"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullProfile = getFullProfile;
exports.updateBasicProfile = updateBasicProfile;
exports.updateProfessionalProfile = updateProfessionalProfile;
exports.updateSocialLinks = updateSocialLinks;
exports.replaceSkills = replaceSkills;
exports.upsertEducation = upsertEducation;
exports.deleteEducation = deleteEducation;
exports.upsertExperience = upsertExperience;
exports.deleteExperience = deleteExperience;
exports.upsertProject = upsertProject;
exports.deleteProject = deleteProject;
exports.upsertCertification = upsertCertification;
exports.deleteCertification = deleteCertification;
const db_1 = __importDefault(require("../database/db"));
async function getFullProfile(userId) {
    const [[user]] = await db_1.default.query(`SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.created_at,
            p.phone, p.location, p.profile_photo_url, p.current_job_title,
            p.current_company, p.total_experience, p.relevant_experience,
            p.notice_period, p.current_salary, p.expected_salary,
            p.preferred_locations, p.employment_type, p.summary
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`, [userId]);
    const [socialLinks] = await db_1.default.query("SELECT linkedin, github, portfolio FROM social_links WHERE user_id = ?", [userId]);
    const [skills] = await db_1.default.query("SELECT id, type, name FROM skills WHERE user_id = ? ORDER BY type, name", [userId]);
    const [educations] = await db_1.default.query(`SELECT id, level, institution, degree, field_of_study, 
            start_date, end_date, grade
     FROM educations WHERE user_id = ? ORDER BY end_date DESC`, [userId]);
    const [experiences] = await db_1.default.query(`SELECT id, company, designation, start_date, end_date,
            currently_working, description, technologies
     FROM experiences WHERE user_id = ? ORDER BY start_date DESC`, [userId]);
    const [projects] = await db_1.default.query(`SELECT id, name, description, technologies, project_url, github_url
     FROM projects WHERE user_id = ? ORDER BY id DESC`, [userId]);
    const [certifications] = await db_1.default.query(`SELECT id, name, organization, issue_date, credential_url
     FROM certifications WHERE user_id = ? ORDER BY issue_date DESC`, [userId]);
    const [resumes] = await db_1.default.query(`SELECT id, original_filename, file_size, mime_type, is_primary, created_at
     FROM resumes WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC`, [userId]);
    return {
        user: {
            id: user?.id,
            firstName: user?.first_name,
            lastName: user?.last_name,
            email: user?.email,
            avatarUrl: user?.profile_photo_url || user?.avatar_url,
        },
        profile: user
            ? {
                phone: user.phone,
                location: user.location,
                currentJobTitle: user.current_job_title,
                currentCompany: user.current_company,
                totalExperience: user.total_experience,
                relevantExperience: user.relevant_experience,
                noticePeriod: user.notice_period,
                currentSalary: user.current_salary,
                expectedSalary: user.expected_salary,
                preferredLocations: user.preferred_locations,
                employmentType: user.employment_type,
                summary: user.summary,
            }
            : null,
        socialLinks: socialLinks[0] || null,
        skills: {
            technical: skills.filter((s) => s.type === "technical").map((s) => ({ id: s.id, name: s.name })),
            soft: skills.filter((s) => s.type === "soft").map((s) => ({ id: s.id, name: s.name })),
            languages: skills.filter((s) => s.type === "language").map((s) => ({ id: s.id, name: s.name })),
        },
        educations: educations.map((e) => ({
            id: e.id,
            level: e.level,
            institution: e.institution,
            degree: e.degree,
            fieldOfStudy: e.field_of_study,
            startDate: e.start_date,
            endDate: e.end_date,
            grade: e.grade,
        })),
        experiences: experiences.map((e) => ({
            id: e.id,
            company: e.company,
            designation: e.designation,
            startDate: e.start_date,
            endDate: e.end_date,
            currentlyWorking: Boolean(e.currently_working),
            description: e.description,
            technologies: e.technologies,
        })),
        projects: projects.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            technologies: p.technologies,
            projectUrl: p.project_url,
            githubUrl: p.github_url,
        })),
        certifications: certifications.map((c) => ({
            id: c.id,
            name: c.name,
            organization: c.organization,
            issueDate: c.issue_date,
            credentialUrl: c.credential_url,
        })),
        resumes: resumes.map((r) => ({
            id: r.id,
            originalFilename: r.original_filename,
            fileSize: r.file_size,
            mimeType: r.mime_type,
            isPrimary: Boolean(r.is_primary),
            createdAt: r.created_at,
        })),
    };
}
async function updateBasicProfile(userId, data) {
    await db_1.default.query("UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE id = ?", [data.firstName, data.lastName, userId]);
    await db_1.default.query(`UPDATE profiles SET phone = ?, location = ?, updated_at = NOW() WHERE user_id = ?`, [data.phone || null, data.location || null, userId]);
}
async function updateProfessionalProfile(userId, data) {
    await db_1.default.query(`UPDATE profiles SET 
      current_job_title = ?, current_company = ?, total_experience = ?,
      relevant_experience = ?, notice_period = ?, current_salary = ?,
      expected_salary = ?, preferred_locations = ?, employment_type = ?,
      summary = ?, updated_at = NOW()
     WHERE user_id = ?`, [
        data.currentJobTitle || null,
        data.currentCompany || null,
        data.totalExperience || null,
        data.relevantExperience || null,
        data.noticePeriod || null,
        data.currentSalary || null,
        data.expectedSalary || null,
        data.preferredLocations || null,
        data.employmentType || null,
        data.summary || null,
        userId,
    ]);
}
async function updateSocialLinks(userId, data) {
    const [existing] = await db_1.default.query("SELECT id FROM social_links WHERE user_id = ?", [userId]);
    if (existing.length > 0) {
        await db_1.default.query(`UPDATE social_links SET linkedin = ?, github = ?, portfolio = ?, updated_at = NOW()
       WHERE user_id = ?`, [data.linkedin || null, data.github || null, data.portfolio || null, userId]);
    }
    else {
        await db_1.default.query(`INSERT INTO social_links (user_id, linkedin, github, portfolio) VALUES (?, ?, ?, ?)`, [userId, data.linkedin || null, data.github || null, data.portfolio || null]);
    }
}
async function replaceSkills(userId, skills) {
    await db_1.default.query("DELETE FROM skills WHERE user_id = ?", [userId]);
    if (skills.length > 0) {
        const values = skills.map((s) => [userId, s.type, s.name.trim()]);
        await db_1.default.query("INSERT INTO skills (user_id, type, name) VALUES ?", [values]);
    }
}
async function upsertEducation(userId, education) {
    if (education.id) {
        await db_1.default.query(`UPDATE educations SET level = ?, institution = ?, degree = ?,
       field_of_study = ?, start_date = ?, end_date = ?, grade = ?,
       updated_at = NOW()
       WHERE id = ? AND user_id = ?`, [
            education.level,
            education.institution,
            education.degree || null,
            education.fieldOfStudy || null,
            education.startDate || null,
            education.endDate || null,
            education.grade || null,
            education.id,
            userId,
        ]);
        return education.id;
    }
    else {
        const [result] = await db_1.default.query(`INSERT INTO educations (user_id, level, institution, degree, field_of_study, start_date, end_date, grade)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            education.level,
            education.institution,
            education.degree || null,
            education.fieldOfStudy || null,
            education.startDate || null,
            education.endDate || null,
            education.grade || null,
        ]);
        return result.insertId;
    }
}
async function deleteEducation(userId, educationId) {
    await db_1.default.query("DELETE FROM educations WHERE id = ? AND user_id = ?", [educationId, userId]);
}
async function upsertExperience(userId, experience) {
    if (experience.id) {
        await db_1.default.query(`UPDATE experiences SET company = ?, designation = ?, start_date = ?,
       end_date = ?, currently_working = ?, description = ?, technologies = ?,
       updated_at = NOW()
       WHERE id = ? AND user_id = ?`, [
            experience.company,
            experience.designation,
            experience.startDate,
            experience.currentlyWorking ? null : experience.endDate || null,
            experience.currentlyWorking ? 1 : 0,
            experience.description || null,
            experience.technologies || null,
            experience.id,
            userId,
        ]);
        return experience.id;
    }
    else {
        const [result] = await db_1.default.query(`INSERT INTO experiences 
       (user_id, company, designation, start_date, end_date, currently_working, description, technologies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            experience.company,
            experience.designation,
            experience.startDate,
            experience.currentlyWorking ? null : experience.endDate || null,
            experience.currentlyWorking ? 1 : 0,
            experience.description || null,
            experience.technologies || null,
        ]);
        return result.insertId;
    }
}
async function deleteExperience(userId, experienceId) {
    await db_1.default.query("DELETE FROM experiences WHERE id = ? AND user_id = ?", [experienceId, userId]);
}
async function upsertProject(userId, project) {
    if (project.id) {
        await db_1.default.query(`UPDATE projects SET name = ?, description = ?, technologies = ?,
       project_url = ?, github_url = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`, [
            project.name,
            project.description || null,
            project.technologies || null,
            project.projectUrl || null,
            project.githubUrl || null,
            project.id,
            userId,
        ]);
        return project.id;
    }
    else {
        const [result] = await db_1.default.query(`INSERT INTO projects (user_id, name, description, technologies, project_url, github_url)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            userId,
            project.name,
            project.description || null,
            project.technologies || null,
            project.projectUrl || null,
            project.githubUrl || null,
        ]);
        return result.insertId;
    }
}
async function deleteProject(userId, projectId) {
    await db_1.default.query("DELETE FROM projects WHERE id = ? AND user_id = ?", [projectId, userId]);
}
async function upsertCertification(userId, cert) {
    if (cert.id) {
        await db_1.default.query(`UPDATE certifications SET name = ?, organization = ?, issue_date = ?,
       credential_url = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`, [
            cert.name,
            cert.organization,
            cert.issueDate || null,
            cert.credentialUrl || null,
            cert.id,
            userId,
        ]);
        return cert.id;
    }
    else {
        const [result] = await db_1.default.query(`INSERT INTO certifications (user_id, name, organization, issue_date, credential_url)
       VALUES (?, ?, ?, ?, ?)`, [
            userId,
            cert.name,
            cert.organization,
            cert.issueDate || null,
            cert.credentialUrl || null,
        ]);
        return result.insertId;
    }
}
async function deleteCertification(userId, certId) {
    await db_1.default.query("DELETE FROM certifications WHERE id = ? AND user_id = ?", [certId, userId]);
}
//# sourceMappingURL=profile.service.js.map