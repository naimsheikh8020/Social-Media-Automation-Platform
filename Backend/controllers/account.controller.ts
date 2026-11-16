// controllers/account.controller.ts
import { Request, Response } from "express";
import * as accountService from "../services/account.service.js";
import * as zernioService from "../services/zernio.service.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/response.js";
import { addAccountSchema } from "../utils/validators.js";

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

export const addAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Authenticate user
    const userId = req.auth?.userId;

    if (!userId) {
      throw new AppError("Not authenticated", 401, "NO_TOKEN");
    }

    // 2. Validate request body
    const validation = addAccountSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues[0]?.message || "Invalid platform",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { platform } = validation.data;

    // 3. Validate environment variable
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new AppError(
        "FRONTEND_URL is not configured",
        500,
        "CONFIG_ERROR"
      );
    }

    // 4. Find user
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    // 5. Get or create Zernio profile
    const profileId = await zernioService.getOrCreateZernioProfile(
      userId,
      user.zernioProfileId
    );

    // 6. Build redirect URI
    let redirectUri: string;

    try {
      redirectUri = new URL("/accounts", frontendUrl).toString();
    } catch {
      throw new AppError(
        "Invalid FRONTEND_URL configuration",
        500,
        "CONFIG_ERROR"
      );
    }

    // 7. Generate OAuth URL
    const authUrl = await zernioService.getConnectUrl(
      platform,
      profileId,
      redirectUri
    );

    // 8. Return response
    res.status(200).json({
      success: true,
      url: authUrl,
    });

  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Error in addAccount:", error);

    throw new AppError(
      "Failed to generate add account URL",
      500,
      "ADD_ACCOUNT_ERROR"
    );
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

    const accountId = req.params.id as string;

    // 1. Find account in OUR database
    const account = await accountService.findUserAccount(accountId, userId);
    if (!account) {
      throw new AppError("Account not found or you don't have permission", 404, "ACCOUNT_NOT_FOUND");
    }

    // 2. Tell Zernio to delete (Wrapped in try/catch to ensure DB updates even if Zernio fails)
    try {
      await zernioService.deleteZernioAccount(account.zernioAccountId);
    } catch (zernioError) {
      console.error("Zernio delete failed, but continuing with DB update:", zernioError);
    }

    // 3. Mark as disconnected in OUR database
    await accountService.markAccountDisconnected(account);

    res.json({ success: true, message: "Account disconnected successfully" });
    
  } catch (error: any) {
    console.error("Error disconnecting account:", error?.message || error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to disconnect account", 500, "DISCONNECT_ERROR");
  }
};