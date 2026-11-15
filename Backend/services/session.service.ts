// services/session.service.ts
import { Types } from "mongoose";
import Session from "../models/Session.js";
import { authConfig } from "../config/auth.js";
import { hashRefreshToken } from "../utils/tokens.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

interface Meta { userAgent?: string; ip?: string; }

const expiry = () => new Date(Date.now() + authConfig.refreshTokenTtlMs);

export const createSession = async (
  userId: Types.ObjectId,
  rawRefreshToken: string,
  meta: Meta,
): Promise<void> => {
  await Session.create({
    user: userId,
    refreshTokenHash: hashRefreshToken(rawRefreshToken),
    expiresAt: expiry(),
    ...meta,
  });
};

export const rotateSession = async (
  oldRawToken: string,
  meta: Meta,
): Promise<Types.ObjectId> => {
  const session = await Session.findOne({
    refreshTokenHash: hashRefreshToken(oldRawToken),
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    logger.security("refresh.invalid_token", { ip: meta.ip });
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  await Session.deleteOne({ _id: session._id });
  return session.user;
};

export const revokeSession = async (rawRefreshToken: string): Promise<void> => {
  await Session.deleteOne({ refreshTokenHash: hashRefreshToken(rawRefreshToken) });
};

export const revokeAllSessions = async (userId: string): Promise<void> => {
  await Session.deleteMany({ user: userId });
};

export const capSessionsPerUser = async (userId: Types.ObjectId): Promise<void> => {
  const count = await Session.countDocuments({ user: userId });
  const excess = count - authConfig.maxSessionsPerUser;
  if (excess <= 0) return;

  const oldest = await Session.find({ user: userId })
    .sort({ createdAt: 1 })
    .limit(excess)
    .select("_id")
    .lean();

  if (oldest.length > 0) {
    await Session.deleteMany({ _id: { $in: oldest.map((s) => s._id) } });
  }
};