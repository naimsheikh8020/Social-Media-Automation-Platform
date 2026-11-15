import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal Server Error";
  let code = "INTERNAL_SERVER_ERROR";
  let details: unknown = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = statusCode >= 500 ? "Internal Server Error" : err.message;
    code = statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : err.code;
    details = statusCode >= 500 ? null : err.details;
  } else if ("code" in err && err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
    code = "DUPLICATE_RESOURCE";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
    code = "INVALID_RESOURCE_ID";
  } else if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    statusCode = 400;
    message = "Invalid JSON request body";
    code = "INVALID_JSON";
  }

  console.error({
    message: err.message,
    method: req.method,
    path: req.originalUrl,
  });

  return res.status(statusCode).json({
    success: false,
    status: statusCode >= 500 ? "error" : "fail",
    message,
    error: {
      code,
      details,
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};