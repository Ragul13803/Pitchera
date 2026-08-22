import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Store in memory (we'll upload to UploadThing, not disk)
const storage = multer.memoryStorage();

export const resumeUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Validate PDF
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});