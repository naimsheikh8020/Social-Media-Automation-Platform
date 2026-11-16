// services/zernio.service.ts
import zernio from "../config/zernio.js";
import User from "../models/User.js";
import { Account } from "../models/Account.js";
import { AppError } from "../utils/AppError.js";

// Prevent duplicate provisioning in the same Node.js process
const profilePromises = new Map<string, Promise<string>>();

// ─────────────────────────────────────────────────────────────
// 1. Get or Create Zernio Profile
// ─────────────────────────────────────────────────────────────
export const getOrCreateZernioProfile = async (
  userId: string,
  existingProfileId?: string | null
): Promise<string> => {
  if (!userId) {
    throw new AppError("Invalid user", 400, "INVALID_USER");
  }

  // FAST PATH: If we already saved the ID in our DB, return immediately
  if (existingProfileId) {
    return existingProfileId;
  }

  // RACE CONDITION CHECK
  const existingPromise = profilePromises.get(userId);
  if (existingPromise) {
    return existingPromise;
  }

  // START PROVISIONING
  const promise = (async (): Promise<string> => {
    try {
      const profileName = `workspace-${userId}`;
      const result = await zernio.profiles.listProfiles();
      const data = result.data as any;
      const profiles: any[] = Array.isArray(data) ? data : data?.profiles || data?.data || [];

      const existingProfile = profiles.find((p) => p.name === profileName);

      if (existingProfile) {
        const profileId = existingProfile._id || existingProfile.id;
        if (!profileId) throw new Error("Existing Zernio profile has no ID");
        await User.findByIdAndUpdate(userId, { $set: { zernioProfileId: profileId } });
        return profileId;
      }

      const createResult = await zernio.profiles.createProfile({
        body: { name: profileName } as any,
      });
      const created = (createResult.data as any)?.profile || createResult.data;
      const profileId = created?._id || created?.id;
      
      if (!profileId) throw new Error("Zernio profile creation failed");
      await User.findByIdAndUpdate(userId, { $set: { zernioProfileId: profileId } });
      
      return profileId;
    } catch (error) {
      console.error("Zernio profile provisioning error:", error);
      throw new AppError("Failed to setup Zernio profile", 500, "ZERNIO_PROFILE_ERROR");
    }
  })();

  profilePromises.set(userId, promise);

  try {
    return await promise;
  } finally {
    if (profilePromises.get(userId) === promise) {
      profilePromises.delete(userId);
    }
  }
};

// ─────────────────────────────────────────────────────────────
// 2. Get OAuth Connect URL
// ─────────────────────────────────────────────────────────────
export const getConnectUrl = async (
  platform: string,
  profileId: string,
  redirectUri: string
): Promise<string> => {
  try {
    const result = await zernio.connect.getConnectUrl({
      path: { platform: platform as any },
      query: { profileId, redirect_uri: redirectUri },
    });

    const data = result.data as any;
    const authUrl = data?.authUrl || data?.url;

    if (!authUrl) {
      throw new AppError(`Zernio returned no auth URL: ${JSON.stringify(data)}`, 500, "AUTH_URL_ERROR");
    }

    return authUrl;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to get connect URL: ${error.message}`, 500, "ZERNIO_CONNECT_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 3. Sync Accounts (List from Zernio)
// ─────────────────────────────────────────────────────────────
export const syncZernioAccounts = async (userId: string, profileId: string) => {
  try {
    // 1. Fetch from Zernio
    const result = await zernio.accounts.listAccounts({ query: { profileId } });
    const data = result.data as any;
    const zernioAccounts: any[] = Array.isArray(data) ? data : data?.accounts || data?.data || [];

    // 2. Prepare data
    const validAccounts = zernioAccounts
      .filter((account) => account?._id || account?.id)
      .map((account) => ({
        id: String(account._id || account.id),
        platform: account.platform,
        handle: account.username || account.name || "Unknown",
        avatarUrl: account.avatarUrl || null,
      }));

    const accountIds = validAccounts.map((a) => a.id);

    // 3. Bulk Upsert
    if (validAccounts.length > 0) {
      const operations = validAccounts.map((account) => ({
        updateOne: {
          filter: { user: userId, zernioAccountId: account.id },
          update: {
            $set: {
              platform: account.platform,
              handle: account.handle,
              avatarUrl: account.avatarUrl,
              status: "connected",
            },
            $setOnInsert: { user: userId, zernioAccountId: account.id },
          },
          upsert: true,
        },
      }));
      await Account.bulkWrite(operations, { ordered: false });
    }

    // 4. Mark disconnected accounts
    await Account.updateMany(
      { user: userId, status: "connected", zernioAccountId: { $nin: accountIds } },
      { $set: { status: "disconnected" } }
    );

    // 5. Return updated list
    return await Account.find({ user: userId }).sort({ updatedAt: -1 });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to sync accounts: ${error.message}`, 500, "ZERNIO_SYNC_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 4. Delete Account from Zernio
// ─────────────────────────────────────────────────────────────
export const deleteZernioAccount = async (zernioAccountId: string): Promise<void> => {
  try {
    await zernio.accounts.deleteAccount({
      path: { accountId: zernioAccountId }
    });
  } catch (error: any) {
    // Ignore 404 Not Found (it means it was already deleted on Zernio's end)
    if (error.statusCode !== 404) {
      throw new AppError(`Zernio Delete Error: ${error.message}`, 500, "ZERNIO_DELETE_ERROR");
    }
  }
};