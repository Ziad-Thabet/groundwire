import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import multer from "multer";
import { AppError, LockedOutError } from "../utils/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    const flattened = z.flattenError(err);
    return res.status(400).json({
      error: "Validation failed",
      details: flattened.fieldErrors,
    });
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File exceeds the 25MB size limit." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof Error && err.message.startsWith("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof LockedOutError) {
    res.set("Retry-After", String(err.retryAfterSeconds));
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
}
