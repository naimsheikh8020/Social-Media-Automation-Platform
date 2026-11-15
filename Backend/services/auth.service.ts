// services/auth.service.ts
import bcrypt from "bcrypt";
import { MongoServerError } from "mongodb";
import { Types } from "mongoose";

import User from "../models/User.js";
import { authConfig } from "../config/auth.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens.js";
import * as sessionService from "./session.service.js";

interface Meta { userAgent?: string; ip?: string; }
interface UserView { id: Types.ObjectId; name: string; email: string; }
interface AuthResult { user: UserView; accessToken: string; refreshToken: string; }

const publicUser = (user: { _id: Types.ObjectId; name: string; email: string }): UserView => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const issueSession = async (
  user: { _id: Types.ObjectId; name: string; email: string },
  meta: Meta,
): Promise<AuthResult> => {
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken();

  await sessionService.createSession(user._id, refreshToken, meta);
  await sessionService.capSessionsPerUser(user._id);

  return { user: publicUser(user), accessToken, refreshToken };
};

export const register = async (
  input: { name: string; email: string; password: string },
  meta: Meta,
): Promise<AuthResult> => {
  const existing = await User.exists({ email: input.email });
  if (existing) throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");

  const hashedPassword = await bcrypt.hash(input.password, authConfig.bcryptRounds);

  let user;
  try {
    user = await User.create({ ...input, password: hashedPassword });
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");
    }
    throw err;
  }

  return issueSession(user, meta);
};

// Dummy hash to keep timing constant whether the user exists or not.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO3F1k7ZQ8h7k5B1yQ1p2w2yQ1p2w2yQ1p2";

export const login = async (email: string, password: string, meta: Meta): Promise<AuthResult> => {
  const user = await User.findOne({ email }).select("+password");

  const hashToCompare = user?.password ?? DUMMY_HASH;
  const ok = await bcrypt.compare(password, hashToCompare);

  if (!user || !ok) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

  return issueSession(user, meta);
};

export const refresh = async (oldRawToken: string, meta: Meta): Promise<AuthResult> => {
  const userId = await sessionService.rotateSession(oldRawToken, meta);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 401, "INVALID_REFRESH_TOKEN");

  return issueSession(user, meta);
};