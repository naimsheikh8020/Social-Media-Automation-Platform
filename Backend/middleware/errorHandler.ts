// middleware/errorHandler.ts
import type { ErrorRequestHandler } from "express";
import { MongoServerError } from "mongodb";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate key",
      code: "DUPLICATE_KEY",
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "Invalid id format",
      code: "CAST_ERROR",
    });
  }

  logger.error("unhandled_error", {
    message: err?.message,
    stack: err?.stack,
  });
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
};