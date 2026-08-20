import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/response";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err instanceof ZodError) {
    sendError(
      res,
      "Validation failed",
      422,
      err.errors.map((e: any) => ({ field: e.path.join("."), message: e.message }))
    );
    return;
  }

  if (err.message === "Not allowed by CORS") {
    sendError(res, "CORS error", 403);
    return;
  }

  // jsonwebtoken throws these for an expired/malformed/tampered token — an
  // expected client-side condition (e.g. a stale refresh token), not a
  // server failure. Was previously falling through to 500 below, which is
  // what caused POST /api/auth/refresh to 500 for any invalid/expired
  // refresh token instead of a proper 401.
  if (
    err.name === "TokenExpiredError" ||
    err.name === "JsonWebTokenError" ||
    err.name === "NotBeforeError" ||
    err.message === "Invalid or expired refresh token"
  ) {
    sendError(res, "Invalid or expired token", 401);
    return;
  }

  sendError(res, err.message || "Internal server error", 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}