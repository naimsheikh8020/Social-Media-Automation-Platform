// utils/tokens.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authConfig } from "../config/auth.js";
import { AppError } from "./AppError.js";

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ sub: userId, type: "access" }, authConfig.accessSecret, {
    expiresIn: authConfig.accessTokenTtl,
  });
};

export const verifyAccessToken = (token: string): { userId: string } => {
  try {
    const payload = jwt.verify(token, authConfig.accessSecret) as {
      sub?: string;
      type?: string;
    };

    if (payload.type !== "access" || !payload.sub) {
      throw new AppError("Invalid token type", 401, "INVALID_TOKEN");
    }
    return { userId: payload.sub };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Invalid or expired access token", 401, "INVALID_TOKEN");
  }
};

// Refresh token is an opaque random string — not a JWT.
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

// We only store the SHA-256 hash, never the raw token.
export const hashRefreshToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};