import { Response } from "express";

export function sendSuccess(
  res: Response,
  data: unknown = null,
  message = "Success",
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message = "An error occurred",
  statusCode = 400,
  errors?: unknown
): void {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };
  if (errors !== undefined) {
    body.errors = errors;
  }
  res.status(statusCode).json(body);
}