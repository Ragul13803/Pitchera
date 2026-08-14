"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.findOrCreateGoogleUser = findOrCreateGoogleUser;
exports.refreshAccessToken = refreshAccessToken;
exports.logout = logout;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../database/db"));
const jwt_1 = require("../utils/jwt");
const SALT_ROUNDS = 12;
async function registerUser(firstName, lastName, email, password) {
    const [existing] = await db_1.default.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length > 0) {
        throw new Error("Email already registered");
    }
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const [result] = await db_1.default.query(`INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)`, [firstName, lastName, email.toLowerCase(), passwordHash]);
    const userId = result.insertId;
    // Create empty profile
    await db_1.default.query("INSERT INTO profiles (user_id) VALUES (?)", [userId]);
    // Create empty social links
    await db_1.default.query("INSERT INTO social_links (user_id) VALUES (?)", [userId]);
    // Create default email template
    await createDefaultTemplate(userId);
    const tokens = await createSession(userId, email.toLowerCase());
    return {
        ...tokens,
        user: {
            id: userId,
            firstName,
            lastName,
            email: email.toLowerCase(),
            isEmailVerified: false,
        },
    };
}
async function loginUser(email, password) {
    const [users] = await db_1.default.query("SELECT * FROM users WHERE email = ? AND is_active = 1", [email.toLowerCase()]);
    if (users.length === 0) {
        throw new Error("Invalid email or password");
    }
    const user = users[0];
    if (!user.password_hash) {
        throw new Error("This account uses Google login. Please sign in with Google.");
    }
    const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
    if (!validPassword) {
        throw new Error("Invalid email or password");
    }
    const tokens = await createSession(user.id, user.email);
    return {
        ...tokens,
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            avatarUrl: user.avatar_url,
            isEmailVerified: Boolean(user.is_email_verified),
        },
    };
}
async function findOrCreateGoogleUser(googleProfile) {
    const [existing] = await db_1.default.query("SELECT * FROM users WHERE google_id = ? OR email = ?", [googleProfile.googleId, googleProfile.email.toLowerCase()]);
    let userId;
    let userData;
    if (existing.length > 0) {
        const user = existing[0];
        userId = user.id;
        // Update google_id if not set (existing email account)
        if (!user.google_id) {
            await db_1.default.query(`UPDATE users 
         SET google_id = ?, 
             avatar_url = COALESCE(avatar_url, ?),
             is_email_verified = 1
         WHERE id = ?`, [googleProfile.googleId, googleProfile.avatarUrl, userId]);
        }
        else {
            // Update avatar if new one provided
            await db_1.default.query(`UPDATE users 
         SET avatar_url = COALESCE(?, avatar_url),
             first_name = ?,
             last_name = ?
         WHERE id = ?`, [
                googleProfile.avatarUrl,
                googleProfile.firstName,
                googleProfile.lastName,
                userId,
            ]);
        }
        // Fetch updated user
        const [updated] = await db_1.default.query("SELECT * FROM users WHERE id = ?", [userId]);
        const updatedUser = updated[0];
        userData = {
            id: updatedUser.id,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatar_url,
            isEmailVerified: Boolean(updatedUser.is_email_verified),
        };
    }
    else {
        // Create new user
        const [result] = await db_1.default.query(`INSERT INTO users (first_name, last_name, email, google_id, avatar_url, is_email_verified)
       VALUES (?, ?, ?, ?, ?, 1)`, [
            googleProfile.firstName,
            googleProfile.lastName,
            googleProfile.email.toLowerCase(),
            googleProfile.googleId,
            googleProfile.avatarUrl || null,
        ]);
        userId = result.insertId;
        // Create empty profile and social links
        await db_1.default.query("INSERT INTO profiles (user_id) VALUES (?)", [userId]);
        await db_1.default.query("INSERT INTO social_links (user_id) VALUES (?)", [userId]);
        await createDefaultTemplate(userId);
        userData = {
            id: userId,
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            email: googleProfile.email.toLowerCase(),
            avatarUrl: googleProfile.avatarUrl,
            isEmailVerified: true,
        };
    }
    const tokens = await createSession(userId, googleProfile.email.toLowerCase());
    return { ...tokens, user: userData };
}
async function refreshAccessToken(refreshToken) {
    const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const [sessions] = await db_1.default.query("SELECT * FROM sessions WHERE user_id = ? AND refresh_token_hash = ? AND expires_at > NOW()", [payload.userId, tokenHash]);
    if (sessions.length === 0) {
        throw new Error("Invalid or expired refresh token");
    }
    // Rotate refresh token
    await db_1.default.query("DELETE FROM sessions WHERE refresh_token_hash = ?", [
        tokenHash,
    ]);
    return createSession(payload.userId, payload.email);
}
async function logout(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await db_1.default.query("DELETE FROM sessions WHERE refresh_token_hash = ?", [
        tokenHash,
    ]);
}
async function createSession(userId, email) {
    const accessToken = (0, jwt_1.generateAccessToken)({ userId, email });
    const refreshToken = (0, jwt_1.generateRefreshToken)({ userId, email });
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db_1.default.query("INSERT INTO sessions (user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?)", [userId, tokenHash, expiresAt]);
    return { accessToken, refreshToken };
}
async function createDefaultTemplate(userId) {
    const subject = "Application for {{position}} - {{firstName}} {{lastName}}";
    const body = `Dear {{recruiterName}},

I am writing to express my interest in the {{position}} opportunity at {{company}}.

I have {{experience}} of experience in {{skills}}.

Please find my resume attached for your consideration.

I would appreciate the opportunity to discuss how my experience can contribute to your team.

Thank you for your time and consideration.

Best regards,

{{firstName}} {{lastName}}
{{phone}}
{{email}}
{{linkedin}}`;
    await db_1.default.query(`INSERT INTO email_templates (user_id, name, subject, body, is_default)
     VALUES (?, 'Default Template', ?, ?, 1)`, [userId, subject, body]);
}
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
//# sourceMappingURL=auth.service.js.map