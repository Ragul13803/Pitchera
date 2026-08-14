import { Request, Response, NextFunction } from "express";
export declare function register(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function login(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function logout(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function googleAuth(req: Request, res: Response): void;
export declare function googleCallback(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function googleMobileAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function verifyToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMe(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map