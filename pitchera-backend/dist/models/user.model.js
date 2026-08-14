"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const db_1 = __importDefault(require("../database/db"));
class UserModel {
    static async findByEmail(email) {
        const [rows] = await db_1.default.execute("SELECT * FROM users WHERE email = ?", [email]);
        return rows[0] || null;
    }
    static async findByGoogleId(googleId) {
        const [rows] = await db_1.default.execute("SELECT * FROM users WHERE google_id = ?", [googleId]);
        return rows[0] || null;
    }
    static async findById(id) {
        const [rows] = await db_1.default.execute("SELECT * FROM users WHERE id = ?", [id]);
        return rows[0] || null;
    }
    static async createGoogleUser(userData) {
        const { email, googleId, firstName, lastName, avatarUrl } = userData;
        const [result] = await db_1.default.execute(`INSERT INTO users 
      (email, google_id, first_name, last_name, avatar_url, is_email_verified) 
      VALUES (?, ?, ?, ?, ?, ?)`, [email, googleId, firstName, lastName, avatarUrl, 1]);
        const user = await this.findById(result.insertId);
        if (!user) {
            throw new Error("Failed to create user");
        }
        return user;
    }
    static async updateGoogleId(userId, googleId, avatarUrl) {
        await db_1.default.query(`UPDATE users 
      SET google_id = ?, avatar_url = COALESCE(?, avatar_url), is_email_verified = 1
      WHERE id = ?`, [googleId, avatarUrl, userId]);
    }
    static async updateProfile(userId, data) {
        const updates = [];
        const values = [];
        if (data.firstName) {
            updates.push("first_name = ?");
            values.push(data.firstName);
        }
        if (data.lastName) {
            updates.push("last_name = ?");
            values.push(data.lastName);
        }
        if (data.avatarUrl) {
            updates.push("avatar_url = ?");
            values.push(data.avatarUrl);
        }
        if (updates.length === 0)
            return;
        values.push(userId);
        await db_1.default.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    }
    static toResponse(user) {
        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            avatarUrl: user.avatar_url,
            isEmailVerified: Boolean(user.is_email_verified),
            isActive: Boolean(user.is_active),
        };
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=user.model.js.map