// utils/asyncHandler.ts
// WHY: Express 4 does NOT catch errors thrown inside async functions.
// Without this wrapper, `throw new AppError(...)` becomes an unhandled
// rejection and the client gets a hung request instead of a 4xx/5xx.
import type { RequestHandler } from "express";

export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};