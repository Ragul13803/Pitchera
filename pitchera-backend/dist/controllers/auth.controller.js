"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.googleAuth = googleAuth;
exports.googleCallback = googleCallback;
exports.googleMobileAuth = googleMobileAuth;
exports.verifyToken = verifyToken;
exports.getMe = getMe;
const zod_1 = require("zod");
const authService = __importStar(require("../services/auth.service"));
const googleService = __importStar(require("../services/google.service"));
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).trim(),
    lastName: zod_1.z.string().min(1).max(100).trim(),
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(8).max(128),
    confirmPassword: zod_1.z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(1),
});
const googleMobileSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1, "ID token is required"),
});
async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.registerUser(data.firstName, data.lastName, data.email, data.password);
        (0, response_1.sendSuccess)(res, result, "Registration successful", 201);
    }
    catch (error) {
        next(error);
    }
}
async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authService.loginUser(data.email, data.password);
        (0, response_1.sendSuccess)(res, result, "Login successful");
    }
    catch (error) {
        next(error);
    }
}
async function refreshToken(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            (0, response_1.sendError)(res, "Refresh token required", 400);
            return;
        }
        const tokens = await authService.refreshAccessToken(refreshToken);
        (0, response_1.sendSuccess)(res, tokens, "Token refreshed");
    }
    catch (error) {
        next(error);
    }
}
async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        (0, response_1.sendSuccess)(res, null, "Logged out successfully");
    }
    catch (error) {
        next(error);
    }
}
function googleAuth(req, res) {
    const url = googleService.getGoogleLoginUrl();
    res.redirect(url);
}
async function googleCallback(req, res, next) {
    try {
        const { code, error } = req.query;
        if (error || !code) {
            res.redirect(`${env_1.env.frontendUrl}/(auth)/login?error=google_auth_failed`);
            return;
        }
        const googleUser = await googleService.getGoogleUserInfo(String(code));
        const result = await authService.findOrCreateGoogleUser(googleUser);
        const params = new URLSearchParams({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
        res.redirect(`${env_1.env.frontendUrl}/auth/callback?${params.toString()}`);
    }
    catch (error) {
        next(error);
    }
}
// Mobile Google authentication
async function googleMobileAuth(req, res, next) {
    try {
        const { idToken } = googleMobileSchema.parse(req.body);
        // Verify the Google ID token
        const googleUser = await googleService.verifyGoogleIdToken(idToken);
        // Find or create user
        const result = await authService.findOrCreateGoogleUser({
            googleId: googleUser.googleId,
            email: googleUser.email,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            avatarUrl: googleUser.avatarUrl,
        });
        (0, response_1.sendSuccess)(res, result, "Google authentication successful");
    }
    catch (error) {
        console.error("Google mobile auth error:", error);
        if (error.message?.includes("Invalid Google ID token")) {
            (0, response_1.sendError)(res, "Invalid Google authentication token", 401);
        }
        else {
            next(error);
        }
    }
}
// Verify token
async function verifyToken(req, res, next) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, "User not authenticated", 401);
            return;
        }
        const pool = (await Promise.resolve().then(() => __importStar(require("../database/db")))).default;
        const [users] = await pool.query(`SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url,
              u.is_email_verified, u.is_active,
              p.profile_photo_url, p.current_job_title
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`, [req.user.userId]);
        if (users.length === 0) {
            (0, response_1.sendError)(res, "User not found", 404);
            return;
        }
        const user = users[0];
        (0, response_1.sendSuccess)(res, {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            avatarUrl: user.profile_photo_url || user.avatar_url,
            currentJobTitle: user.current_job_title,
            isEmailVerified: Boolean(user.is_email_verified),
            isActive: Boolean(user.is_active),
        }, "Token is valid");
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, "User not authenticated", 401);
            return;
        }
        const pool = (await Promise.resolve().then(() => __importStar(require("../database/db")))).default;
        const [users] = await pool.query(`SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url,
              p.profile_photo_url, p.current_job_title
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`, [req.user.userId]);
        if (users.length === 0) {
            (0, response_1.sendError)(res, "User not found", 404);
            return;
        }
        const user = users[0];
        (0, response_1.sendSuccess)(res, {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            avatarUrl: user.profile_photo_url || user.avatar_url,
            currentJobTitle: user.current_job_title,
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.controller.js.map