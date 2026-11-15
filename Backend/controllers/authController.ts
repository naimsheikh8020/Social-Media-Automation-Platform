// controllers/auth.controller.ts
// NOTE: No asyncHandler needed. Express 5 auto-catches rejected promises
// from async handlers and forwards them to the error middleware.
import type { Request, Response } from "express";

import * as authService from "../services/auth.service.js";
import * as sessionService from "../services/session.service.js";
import { setRefreshCookie, clearRefreshCookie } from "../utils/cookies.js";
import { getRefreshCookie, requireUserId, clientMeta } from "../utils/request.js";
import { ok, created } from "../utils/response.js";
import User from "../models/User.js";

// POST /api/auth/register
export const registerUser = async (req: Request, res: Response) => {
  const result = await authService.register(req.body, clientMeta(req));
  setRefreshCookie(res, result.refreshToken);
  return created(res, { user: result.user, accessToken: result.accessToken }, "Registration successful");
};

// POST /api/auth/login
export const loginUser = async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password, clientMeta(req));
  setRefreshCookie(res, result.refreshToken);
  return ok(res, { user: result.user, accessToken: result.accessToken });
};

// POST /api/auth/refresh
export const refreshToken = async (req: Request, res: Response) => {
  const oldToken = getRefreshCookie(req);

  try {
    const result = await authService.refresh(oldToken, clientMeta(req));
    setRefreshCookie(res, result.refreshToken);
    return ok(res, { accessToken: result.accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    throw err; // Express 5 forwards this to the error handler
  }
};

// POST /api/auth/logout
export const logoutUser = async (req: Request, res: Response) => {
  const token = req.cookies?.["refreshToken"] as string | undefined;
  if (token) await sessionService.revokeSession(token);
  clearRefreshCookie(res);
  return ok(res, null, "Logged out");
};

// POST /api/auth/logout-all
export const logoutAll = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  await sessionService.revokeAllSessions(userId);
  clearRefreshCookie(res);
  return ok(res, null, "All sessions revoked");
};

// GET /api/auth/me
export const getMe = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("User not found");
  return ok(res, { user: { id: user._id, name: user.name, email: user.email } });
};