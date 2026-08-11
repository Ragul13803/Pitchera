import { Router } from "express";
import * as jobsController from "../controllers/jobs.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", jobsController.getJobApplications);
router.post("/", jobsController.createJobApplication);
router.get("/:id", jobsController.getJobApplication);
router.patch("/:id/status", jobsController.updateJobStatus);

export default router;