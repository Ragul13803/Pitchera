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
const express_1 = require("express");
const profileController = __importStar(require("../controllers/profile.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/", profileController.getProfile);
router.get("/completion", profileController.getProfileCompletion);
// Basic info
router.put("/basic", profileController.updateBasicInfo);
router.put("/professional", profileController.updateProfessionalInfo);
router.put("/social", profileController.updateSocialLinks);
router.put("/skills", profileController.updateSkills);
// Education
router.post("/education", profileController.upsertEducation);
router.put("/education", profileController.upsertEducation);
router.delete("/education/:id", profileController.deleteEducation);
// Experience
router.post("/experience", profileController.upsertExperience);
router.put("/experience", profileController.upsertExperience);
router.delete("/experience/:id", profileController.deleteExperience);
// Projects
router.post("/project", profileController.upsertProject);
router.put("/project", profileController.upsertProject);
router.delete("/project/:id", profileController.deleteProject);
// Certifications
router.post("/certification", profileController.upsertCertification);
router.put("/certification", profileController.upsertCertification);
router.delete("/certification/:id", profileController.deleteCertification);
// Resume
router.post("/resume", upload_1.resumeUpload.single("resume"), profileController.uploadResume);
router.post("/resume/:resumeId/parse", profileController.parseResume);
router.delete("/resume/:id", profileController.deleteResume);
router.put("/resume/:id/primary", profileController.setPrimaryResume);
// Profile photo
router.post("/photo", upload_1.profilePhotoUpload.single("photo"), profileController.uploadProfilePhoto);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map