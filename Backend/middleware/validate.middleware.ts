// middleware/validate.middleware.ts
import type { RequestHandler } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError.js";

export const validate = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return next(new AppError(issue?.message ?? "Validation failed", 400, "VALIDATION_ERROR"));
  }
  req.body = result.data;
  next();
};