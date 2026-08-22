import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { resumeUpload } from "../middleware/upload.middleware";
import { ResumeController } from "../controllers/resume.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get primary resume
router.get("/", ResumeController.getResume);

// Upload new resume (replaces old one)
router.post(
  "/upload",
  resumeUpload.single("resume"),
  ResumeController.uploadResume
);

// Delete resume
router.delete("/:id", ResumeController.deleteResume);

export default router;