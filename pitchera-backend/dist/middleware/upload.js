"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profilePhotoUpload = exports.attachmentUpload = exports.resumeUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const ALLOWED_RESUME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_ATTACHMENT_TYPES = [
    ...ALLOWED_RESUME_TYPES,
    "image/jpeg",
    "image/png",
];
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
function createStorage(subDir) {
    return multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const dir = path_1.default.join(env_1.env.uploadDir, subDir);
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path_1.default.extname(file.originalname);
            const storedName = `${(0, uuid_1.v4)()}${ext}`;
            cb(null, storedName);
        },
    });
}
exports.resumeUpload = (0, multer_1.default)({
    storage: createStorage("resumes"),
    limits: { fileSize: env_1.env.maxFileSizeMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_RESUME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only PDF, DOC, and DOCX files are allowed for resumes"));
        }
    },
});
exports.attachmentUpload = (0, multer_1.default)({
    storage: createStorage("attachments"),
    limits: { fileSize: env_1.env.maxFileSizeMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_ATTACHMENT_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type"));
        }
    },
});
exports.profilePhotoUpload = (0, multer_1.default)({
    storage: createStorage("photos"),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only JPEG, PNG and WebP images are allowed"));
        }
    },
});
//# sourceMappingURL=upload.js.map