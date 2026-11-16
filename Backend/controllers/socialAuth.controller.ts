import { Request, Response } from "express";
import * as zernioService from "../services/zernio.service.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

// GET /api/oauth/:platform
export const generateAuthUrl = async (req: Request, res: Response) => {
  try {
    // 👇 The fix: Cast platform to a string
    const platform = req.params.platform as string;
    const userId = req.auth?.userId;

    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    // 1. Get Profile ID
    const profileId = await zernioService.getOrCreateZernioProfile(user);

    // 2. Build Redirect URL
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new AppError("FRONTEND_URL is not configured", 500, "CONFIG_ERROR");
    const redirectUri = new URL("/accounts", frontendUrl).toString();

    // 3. Get Auth URL
    const authUrl = await zernioService.getConnectUrl(platform, profileId, redirectUri);

    return res.json({ success: true, url: authUrl });

  } catch (error: any) {
    console.error("Error generating auth URL:", error?.message || error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to generate authentication URL", 500, "AUTH_URL_ERROR");
  }
};

// GET /api/oauth/sync/accounts
export const syncAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    // 1. Get Profile ID
    const profileId = await zernioService.getOrCreateZernioProfile(user);

    // 2. Sync Accounts
    const accounts = await zernioService.syncZernioAccounts(userId, profileId);

    // 3. Return Response
    res.json({
      success: true,
      count: accounts.length,
      accounts,
    });

  } catch (error: any) {
    console.error("Error syncing accounts:", error?.message || error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to sync social accounts", 500, "SYNC_ACCOUNTS_ERROR");
  }
};