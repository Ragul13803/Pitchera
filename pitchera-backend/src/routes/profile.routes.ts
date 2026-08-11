import { Router } from "express";
import * as profileController from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  resumeUpload,
  profilePhotoUpload,
} from "../middleware/upload";

const router = Router();

router.use(authenticate);

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
router.post(
  "/resume",
  resumeUpload.single("resume"),
  profileController.uploadResume
);
router.post("/resume/:resumeId/parse", profileController.parseResume);
router.delete("/resume/:id", profileController.deleteResume);
router.put("/resume/:id/primary", profileController.setPrimaryResume);

// Profile photo
router.post(
  "/photo",
  profilePhotoUpload.single("photo"),
  profileController.uploadProfilePhoto
);

export default router;