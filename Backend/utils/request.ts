// utils/request.ts
import type { Request } from "express";
import { AppError } from "./AppError.js";
import { authConfig } from "../config/auth.js";

export const getRefreshCookie = (req: Request): string => {
  const raw = req.cookies?.[authConfig.cookieName] as string | undefined;
  if (!raw) throw new AppError("No refresh token", 401, "NO_REFRESH_TOKEN");
  return raw;
};

export const requireUserId = (req: Request): string => {
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");
  return userId;
};

export const clientMeta = (req: Request) => ({
  userAgent: req.get("user-agent")?.slice(0, 512),
  ip: req.ip?.slice(0, 64),
});