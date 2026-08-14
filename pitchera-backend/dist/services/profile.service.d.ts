export declare function getFullProfile(userId: number): Promise<object>;
export declare function updateBasicProfile(userId: number, data: {
    firstName: string;
    lastName: string;
    phone?: string;
    location?: string;
}): Promise<void>;
export declare function updateProfessionalProfile(userId: number, data: {
    currentJobTitle?: string;
    currentCompany?: string;
    totalExperience?: string;
    relevantExperience?: string;
    noticePeriod?: string;
    currentSalary?: string;
    expectedSalary?: string;
    preferredLocations?: string;
    employmentType?: string;
    summary?: string;
}): Promise<void>;
export declare function updateSocialLinks(userId: number, data: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
}): Promise<void>;
export declare function replaceSkills(userId: number, skills: Array<{
    type: "technical" | "soft" | "language";
    name: string;
}>): Promise<void>;
export declare function upsertEducation(userId: number, education: {
    id?: number;
    level: string;
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
}): Promise<number>;
export declare function deleteEducation(userId: number, educationId: number): Promise<void>;
export declare function upsertExperience(userId: number, experience: {
    id?: number;
    company: string;
    designation: string;
    startDate: string;
    endDate?: string;
    currentlyWorking: boolean;
    description?: string;
    technologies?: string;
}): Promise<number>;
export declare function deleteExperience(userId: number, experienceId: number): Promise<void>;
export declare function upsertProject(userId: number, project: {
    id?: number;
    name: string;
    description?: string;
    technologies?: string;
    projectUrl?: string;
    githubUrl?: string;
}): Promise<number>;
export declare function deleteProject(userId: number, projectId: number): Promise<void>;
export declare function upsertCertification(userId: number, cert: {
    id?: number;
    name: string;
    organization: string;
    issueDate?: string;
    credentialUrl?: string;
}): Promise<number>;
export declare function deleteCertification(userId: number, certId: number): Promise<void>;
//# sourceMappingURL=profile.service.d.ts.map