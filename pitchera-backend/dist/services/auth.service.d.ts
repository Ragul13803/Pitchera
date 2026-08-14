export declare function registerUser(firstName: string, lastName: string, email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: object;
}>;
export declare function loginUser(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: object;
}>;
export declare function findOrCreateGoogleUser(googleProfile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}): Promise<{
    accessToken: string;
    refreshToken: string;
    user: object;
}>;
export declare function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare function logout(refreshToken: string): Promise<void>;
//# sourceMappingURL=auth.service.d.ts.map