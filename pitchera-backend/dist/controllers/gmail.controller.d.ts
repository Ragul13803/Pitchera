import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare function initiateGmailAuth(req: AuthRequest, res: Response): void;
export declare function gmailCallback(req: AuthRequest & {
    query: {
        code?: string;
        error?: string;
        state?: string;
    };
}, res: Response, next: NextFunction): Promise<void>;
export declare function getGmailStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function disconnectGmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=gmail.controller.d.ts.map