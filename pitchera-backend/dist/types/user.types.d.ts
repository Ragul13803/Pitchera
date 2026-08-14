export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string | null;
    google_id: string | null;
    avatar_url: string | null;
    is_email_verified: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    isEmailVerified: boolean;
    isActive: boolean;
}
export interface GoogleUserData {
    email: string;
    googleId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
}
export interface JWTPayload {
    id: number;
    email: string;
}
export interface AuthResponse {
    success: boolean;
    token: string;
    user: UserResponse;
}
//# sourceMappingURL=user.types.d.ts.map