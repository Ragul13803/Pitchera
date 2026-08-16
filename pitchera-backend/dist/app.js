"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const gmail_routes_1 = __importDefault(require("./routes/gmail.routes"));
const jobs_routes_1 = __importDefault(require("./routes/jobs.routes"));
const email_routes_1 = __importDefault(require("./routes/email.routes"));
const resume_routes_1 = __importDefault(require("./routes/resume.routes"));
const app = (0, express_1.default)();
/**
 * =========================================================
 * SECURITY
 * =========================================================
 */
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: {
        policy: "cross-origin",
    },
}));
/**
 * =========================================================
 * CORS
 * =========================================================
 *
 * Local development:
 *   http://localhost:8082
 *   http://localhost:8081
 *   http://localhost:3000
 *   http://localhost:19006
 *
 * Production:
 *   env.frontendUrl
 *
 * env.frontendUrl should be your deployed Netlify URL.
 */
const allowedOrigins = [
    env_1.env.frontendUrl,
    "https://pitchera.netlify.app/login",
    // Local development
    "http://localhost:8082",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:19006",
].filter(Boolean);
console.log("🌐 Allowed CORS origins:", allowedOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // React Native / native requests may not send Origin
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.log("❌ CORS blocked origin:", origin);
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
    ],
}));
/**
 * =========================================================
 * COMPRESSION
 * =========================================================
 */
app.use((0, compression_1.default)());
/**
 * =========================================================
 * RATE LIMITING
 * =========================================================
 */
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        success: false,
        message: "Too many requests, please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: "Too many auth attempts, please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);
/**
 * =========================================================
 * BODY PARSING
 * =========================================================
 */
app.use(express_1.default.json({
    limit: "10mb",
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: "10mb",
}));
/**
 * =========================================================
 * STATIC UPLOADS
 * =========================================================
 */
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), env_1.env.uploadDir)));
/**
 * =========================================================
 * BASIC ROUTES
 * =========================================================
 */
app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Pitchera Working Fine!!",
    });
});
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        message: "Pitchera Service is Running!!",
        status: "OK",
        timestamp: new Date().toISOString(),
    });
});
/**
 * =========================================================
 * API ROUTES
 * =========================================================
 */
// Authentication
app.use("/api/auth", authLimiter, auth_routes_1.default);
// Profile
app.use("/api/profile", profile_routes_1.default);
// Gmail
app.use("/api/gmail", gmail_routes_1.default);
// Jobs
app.use("/api/jobs", jobs_routes_1.default);
// Email
app.use("/api/emails", email_routes_1.default);
app.use('/api/resume', resume_routes_1.default);
/**
 * =========================================================
 * 404 HANDLER
 * =========================================================
 */
app.use(errorHandler_1.notFoundHandler);
/**
 * =========================================================
 * GLOBAL ERROR HANDLER
 * =========================================================
 */
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map