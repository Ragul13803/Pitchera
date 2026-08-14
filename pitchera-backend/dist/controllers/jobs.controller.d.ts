import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare function createJobApplication(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getJobApplications(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getJobApplication(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function updateJobStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=jobs.controller.d.ts.map