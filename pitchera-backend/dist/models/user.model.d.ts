import { User, GoogleUserData, UserResponse } from "../types/user.types";
export declare class UserModel {
    static findByEmail(email: string): Promise<User | null>;
    static findByGoogleId(googleId: string): Promise<User | null>;
    static findById(id: number): Promise<User | null>;
    static createGoogleUser(userData: GoogleUserData): Promise<User>;
    static updateGoogleId(userId: number, googleId: string, avatarUrl?: string): Promise<void>;
    static updateProfile(userId: number, data: {
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    }): Promise<void>;
    static toResponse(user: User): UserResponse;
}
//# sourceMappingURL=user.model.d.ts.map