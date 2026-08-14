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
export declare function calculateProfileCompletion(userId: number): Promise<CompletionResult>;
export {};
//# sourceMappingURL=profileCompletion.service.d.ts.map