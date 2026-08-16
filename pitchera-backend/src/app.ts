import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import gmailRoutes from "./routes/gmail.routes";
import jobsRoutes from "./routes/jobs.routes";
import emailRoutes from "./routes/email.routes";
import resumeRoutes from "./routes/resume.routes";
import applicationRoutes from "./routes/applications.routes";
import emailTemplateRoutes from "./routes/email-templates.routes";
import { startScheduler } from "./services/scheduler.service";


const app = express();

/**
 * =========================================================
 * SECURITY
 * =========================================================
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

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
  env.frontendUrl,
  "https://pitchera.netlify.app/login",

  // Local development
  "http://localhost:8082",
  "http://localhost:8081",
  "http://localhost:3000",
  "http://localhost:19006",
].filter(Boolean);

console.log("🌐 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // React Native / native requests may not send Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked origin:", origin);

      return callback(
        new Error(`CORS blocked: ${origin}`)
      );
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
  })
);

/**
 * =========================================================
 * COMPRESSION
 * =========================================================
 */
app.use(compression());

/**
 * =========================================================
 * RATE LIMITING
 * =========================================================
 */

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,

  message: {
    success: false,
    message: "Too many requests, please try again later",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
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
app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/**
 * =========================================================
 * STATIC UPLOADS
 * =========================================================
 */
app.use(
  "/uploads",
  express.static(
    path.join(
      process.cwd(),
      env.uploadDir
    )
  )
);

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
app.use("/api/auth", authLimiter, authRoutes);

// Profile
app.use( "/api/profile", profileRoutes );

// Gmail
app.use( "/api/gmail", gmailRoutes );

// Jobs
app.use( "/api/jobs", jobsRoutes );

// Email
app.use( "/api/emails", emailRoutes );

app.use('/api/resume', resumeRoutes);

app.use("/api/applications", applicationRoutes);
app.use("/api/email-templates", emailTemplateRoutes);

/**
 * =========================================================
 * 404 HANDLER
 * =========================================================
 */
app.use(notFoundHandler);

/**
 * =========================================================
 * GLOBAL ERROR HANDLER
 * =========================================================
 */
app.use(errorHandler);

export default app;