// middleware/auth.middleware.ts
import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/tokens.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: { userId: string };
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Missing Authorization header", 401, "NO_TOKEN"));
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const { userId } = verifyAccessToken(token);
    req.auth = { userId };
    next();
  } catch (err) {
    next(err);
  }
};