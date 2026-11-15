// middleware/error.middleware.ts
import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = 500;
  let message = "Internal Server Error";
  let code = "INTERNAL_SERVER_ERROR";
  let details: unknown = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = statusCode >= 500 ? "Internal Server Error" : err.message;
    code = statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : err.code;
    details = statusCode >= 500 ? null : err.details;
  } else if (err instanceof MongoServerError && err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
    code = "DUPLICATE_RESOURCE";
    details = err.keyValue ?? null;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    details = Object.fromEntries(Object.entries(err.errors).map(([f, e]) => [f, e.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid resource ID";
    code = "INVALID_RESOURCE_ID";
  } else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body";
    code = "INVALID_JSON";
  }

  const meta = {
    message: err.message,
    code,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    ...(statusCode >= 500 ? { stack: err.stack } : {}),
  };

  if (statusCode >= 500) logger.error("request.failed", meta);
  else logger.warn("request.rejected", meta);

  return res.status(statusCode).json({
    success: false,
    status: statusCode >= 500 ? "error" : "fail",
    message,
    error: { code, details },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};