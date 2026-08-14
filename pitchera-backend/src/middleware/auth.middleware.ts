import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";
import { sendError } from "../utils/response";

export type AuthRequest = Request;


// Remove AuthRequest interface - use Express.Request directly
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, "Authentication required", 401);
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // Now TypeScript knows about this property
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
}