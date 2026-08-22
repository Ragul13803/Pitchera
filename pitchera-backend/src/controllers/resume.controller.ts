import { Request, Response } from "express";
import { ResumeService } from "../services/resume.service";
import { UploadThingService } from "../services/uploadthing.service";
import { ResumeUploadResponse } from "../types/resume.types";

export class ResumeController {
  /**
   * GET /api/resume - Get user's primary resume
   */
  static async getResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      const resume = await ResumeService.getPrimaryResume(userId);

      res.json({ resume });
    } catch (error) {
      console.error("❌ Error fetching resume:", error);
      res.status(500).json({
        error: "Failed to fetch resume",
      });
    }
  }

  /**
   * POST /api/resume/upload - Upload new resume
   */
  static async uploadResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const file = req.file;

      // Validate file exists
      if (!file) {
        return res.status(400).json({
          error: "No file uploaded",
        });
      }

      // Validate file size (double-check after multer)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: "File too large",
          message: "Resume must be 5 MB or smaller",
        });
      }

      // Validate actual file signature, not just the client-supplied MIME
      // type/filename (both are trivially spoofable). Real PDFs start
      // with the "%PDF-" magic bytes.
      if (file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        return res.status(400).json({
          error: "Invalid file type",
          message: "File does not appear to be a valid PDF",
        });
      }

      console.log(`📤 Uploading resume for user ${userId}: ${file.originalname}`);

      // Get old resume key for cleanup
      const oldResumeKey = await ResumeService.getOldResumeKey(userId);

      // Upload to UploadThing
      const uploadedFile = await UploadThingService.uploadFile(file);

      // Save to database
      const resume = await ResumeService.saveResume(userId, uploadedFile);

      // Clean up old file (non-blocking)
      if (oldResumeKey) {
        UploadThingService.deleteFile(oldResumeKey).catch((err) =>
          console.error("Failed to delete old resume:", err)
        );
      }

      console.log(`✅ Resume uploaded successfully for user ${userId}`);

      const response: ResumeUploadResponse = {
        success: true,
        message: "Resume uploaded successfully",
        resume,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("❌ Resume upload error:", error);

      const message =
        error instanceof Error ? error.message : "Failed to upload resume";

      res.status(500).json({
        error: "Upload failed",
        message,
      });
    }
  }

  /**
   * DELETE /api/resume/:id - Delete resume
   */
  static async deleteResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const resumeId = parseInt(req.params.id);

      // Get resume details before deletion
      const resume = await ResumeService.getPrimaryResume(userId);

      if (!resume || resume.id !== resumeId) {
        return res.status(404).json({
          error: "Resume not found",
        });
      }

      // Delete from database
      const deleted = await ResumeService.deleteResume(resumeId, userId);

      if (!deleted) {
        return res.status(404).json({
          error: "Resume not found",
        });
      }

      // Delete from UploadThing (non-blocking)
      if (resume.stored_filename) {
        UploadThingService.deleteFile(resume.stored_filename).catch((err) =>
          console.error("Failed to delete from storage:", err)
        );
      }

      res.json({
        success: true,
        message: "Resume deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting resume:", error);
      res.status(500).json({
        error: "Failed to delete resume",
      });
    }
  }
}