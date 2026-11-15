// config/auth.ts
import type { SignOptions } from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;

if (!accessSecret) throw new Error("JWT_ACCESS_SECRET is required");
if (accessSecret.length < 32) throw new Error("JWT_ACCESS_SECRET must be at least 32 chars");

export const isProd = process.env.NODE_ENV === "production";

export const authConfig = {
  accessSecret,
  // Cast to jsonwebtoken's own type — this is exactly what it expects.
  accessTokenTtl: (process.env.JWT_ACCESS_TTL ?? "15m") as SignOptions["expiresIn"],
  refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
  maxSessionsPerUser: 10,
  bcryptRounds: 12,
  cookieName: "refreshToken",
  cookiePath: "/api/auth",
} as const;