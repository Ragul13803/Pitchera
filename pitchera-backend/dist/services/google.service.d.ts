export declare function getOAuthClient(): import("googleapis-common").OAuth2Client;
export declare function getGmailOAuthClient(): import("googleapis-common").OAuth2Client;
export declare function getGoogleLoginUrl(state?: string): string;
export declare function getGmailAuthUrl(userId: number): string;
export declare function getGoogleUserInfo(code: string): Promise<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}>;
/**
 * Verify Google ID token from mobile app
 */
export declare function verifyGoogleIdToken(idToken: string): Promise<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    emailVerified: boolean;
}>;
export declare function exchangeGmailCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenExpiry: Date | null;
    gmailAddress: string;
}>;
//# sourceMappingURL=google.service.d.ts.map