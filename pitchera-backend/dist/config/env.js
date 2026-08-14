"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
exports.env = {
    port: parseInt(process.env.PORT || "5000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    database: {
        host: requireEnv("DATABASE_HOST"),
        port: parseInt(process.env.DATABASE_PORT || "3306", 10),
        user: requireEnv("DATABASE_USER"),
        password: requireEnv("DATABASE_PASSWORD"),
        name: requireEnv("DATABASE_NAME"),
    },
    jwt: {
        secret: requireEnv("JWT_SECRET"),
        refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    google: {
        clientId: requireEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
        redirectUri: requireEnv("GOOGLE_REDIRECT_URI"),
        gmailRedirectUri: requireEnv("GOOGLE_GMAIL_REDIRECT_URI"),
        webClientId: process.env.GOOGLE_WEB_CLIENT_ID || "", // Same as clientId usually
    },
    encryptionKey: requireEnv("ENCRYPTION_KEY"),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:8081",
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
};
//# sourceMappingURL=env.js.map