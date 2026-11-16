// controllers/account.controller.ts
import { Request, Response } from "express";
import * as accountService from "../services/account.service.js";
import * as zernioService from "../services/zernio.service.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/response.js";

// ─────────────────────────────────────────────────────────────
// 1. GET /api/accounts
// List all accounts for the logged-in user
// ─────────────────────────────────────────────────────────────
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const accounts = await accountService.getUserAccounts(userId);
    
    ok(res, { count: accounts.length, accounts });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch accounts", 500, "FETCH_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 2. POST /api/accounts
// Generate OAuth URL to add an account
// ─────────────────────────────────────────────────────────────
export const addAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const { platform } = req.body;
    if (!platform) throw new AppError("Platform is required", 400, "MISSING_PLATFORM");

    // 1. Fetch user
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    // 2. Get Zernio Profile ID
    const profileId = await zernioService.getOrCreateZernioProfile(userId, user.zernioProfileId);
    if (user.zernioProfileId !== profileId) {
      await User.findByIdAndUpdate(userId, { zernioProfileId: profileId });
    }

    // 3. Build Redirect URI
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUri = new URL("/accounts", frontendUrl).toString();

    // 4. Get the Auth URL from Zernio Service
    const authUrl = await zernioService.getConnectUrl(platform, profileId, redirectUri);

    // 5. Send it back
    res.status(200).json({ success: true, url: authUrl });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to generate add account URL", 500, "ADD_ACCOUNT_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 3. DELETE /api/accounts/:id
// Disconnect an account from Zernio AND your database
// ─────────────────────────────────────────────────────────────
export const disconnectAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    // 👇 Fix 1: Cast to string
    const accountId = req.params.id as string;

    // 1. Find account in OUR database
    const account = await accountService.findUserAccount(accountId, userId);
    if (!account) {
      throw new AppError("Account not found or you don't have permission", 404, "ACCOUNT_NOT_FOUND");
    }

    // 2. Tell Zernio to delete (Only works if you added the function)
    // If you haven't added `deleteZernioAccount` to the service yet, 
    // comment out the next line:
    // await zernioService.deleteZernioAccount(account.zernioAccountId);

    // 3. Mark as disconnected in OUR database
    await accountService.markAccountDisconnected(account);

    res.json({ success: true, message: "Account disconnected successfully" });
  } catch (error: any) {
    console.error("Error disconnecting account:", error?.message || error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to disconnect account", 500, "DISCONNECT_ERROR");
  }
};