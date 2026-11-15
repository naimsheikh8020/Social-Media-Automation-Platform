// utils/cookies.ts
import type { Response } from "express";
import { authConfig, isProd } from "../config/auth.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  path: authConfig.cookiePath,
  maxAge: authConfig.refreshTokenTtlMs,
};

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(authConfig.cookieName, token, COOKIE_OPTIONS);
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(authConfig.cookieName, COOKIE_OPTIONS);
};