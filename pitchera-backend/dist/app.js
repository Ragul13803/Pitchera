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
const app = (0, express_1.default)();
// Security
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
// CORS
const allowedOrigins = env_1.env.isProduction
    ? [env_1.env.frontendUrl]
    : [env_1.env.frontendUrl, "http://localhost:8082", "http://localhost:19006"];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Compression
app.use((0, compression_1.default)());
// Rate limiting
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many auth attempts, please try again later" },
});
app.use(globalLimiter);
// Body parsing
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Static files (uploads)
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), env_1.env.uploadDir)));
// Routes
app.get("/", (req, res) => {
    res.json({
        message: "Pitchera Working Fine!!",
    });
});
app.get("/health", (req, res) => {
    res.json({
        message: "Pitchera Service is Running!!",
        status: "OK",
        timestamp: new Date().toISOString()
    });
});
// Routes
app.use("/api/auth", authLimiter, auth_routes_1.default);
app.use("/api/profile", profile_routes_1.default);
app.use("/api/gmail", gmail_routes_1.default);
app.use("/api/jobs", jobs_routes_1.default);
app.use("/api/emails", email_routes_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map