// src/api/middlewares/error.ts
import type { Request, Response, NextFunction } from "express";
import { logger } from "../../config/logger";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error("API Error:", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: error.errors,
    });
  }

  if (error instanceof PrismaClientKnownRequestError) {
    return res.status(400).json({
      success: false,
      error: "Database error",
      code: error.code,
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}
