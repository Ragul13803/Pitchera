import { RowDataPacket } from "mysql2";
interface EmailTemplate extends RowDataPacket {
    id: number;
    user_id: number;
    name: string;
    subject: string;
    body: string;
    is_default: number;
}
interface TemplateVars {
    firstName: string;
    lastName: string;
    recruiterName: string;
    company: string;
    position: string;
    experience: string;
    skills: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
    portfolio: string;
}
export declare function replaceTemplateVariables(template: string, vars: Partial<TemplateVars>): string;
export declare function getDefaultTemplate(userId: number): Promise<EmailTemplate | null>;
export declare function getUserTemplates(userId: number): Promise<EmailTemplate[]>;
export declare function sendJobApplicationEmails(params: {
    userId: number;
    jobApplicationId: number;
    recruiters: Array<{
        name: string;
        email: string;
    }>;
    subject: string;
    body: string;
    resumePath?: string;
    additionalAttachments?: string[];
    gmailAccountId: number;
    templateVarsBase: Partial<TemplateVars>;
}): Promise<{
    sent: number;
    failed: number;
    errors: string[];
}>;
export declare function scheduleEmail(params: {
    userId: number;
    jobApplicationId: number;
    gmailAccountId: number;
    recipientName: string;
    recipientEmail: string;
    subject: string;
    body: string;
    resumePath?: string;
    scheduledAt: Date;
}): Promise<number>;
export {};
//# sourceMappingURL=email.service.d.ts.map