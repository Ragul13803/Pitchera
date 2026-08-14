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
export declare function parseResume(filePath: string, mimeType: string): Promise<ParsedResume>;
export {};
//# sourceMappingURL=resumeParser.service.d.ts.map