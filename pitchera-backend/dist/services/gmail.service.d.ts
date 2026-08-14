import { RowDataPacket } from "mysql2";
interface GmailAccount extends RowDataPacket {
    id: number;
    user_id: number;
    gmail_address: string;
    access_token_encrypted: string;
    refresh_token_encrypted: string;
    token_expiry: Date | null;
    is_active: number;
}
export declare function saveGmailAccount(userId: number, gmailAddress: string, accessToken: string, refreshToken: string, tokenExpiry: Date | null): Promise<number>;
export declare function getGmailClient(userId: number): Promise<{
    client: import("googleapis-common").OAuth2Client;
    account: GmailAccount;
}>;
export declare function sendEmailViaGmail(userId: number, to: string, toName: string, subject: string, body: string, attachmentPaths?: string[]): Promise<string>;
export declare function getGmailStatus(userId: number): Promise<{
    connected: boolean;
    gmailAddress: string | null;
}>;
export declare function disconnectGmail(userId: number): Promise<void>;
export {};
//# sourceMappingURL=gmail.service.d.ts.map