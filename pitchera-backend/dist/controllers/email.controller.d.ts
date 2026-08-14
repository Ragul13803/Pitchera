import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare function getEmailHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getEmailDetail(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getScheduledEmails(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function cancelScheduledEmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getTemplates(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=email.controller.d.ts.map