import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import { Account } from "../models/Account.js";
import User from "../models/User.js";
import zernio from "../config/zernio.js";

// Mock Zernio SDK
vi.mock("../config/zernio.js", () => ({
  default: {
    profiles: { 
      listProfiles: vi.fn(), 
      createProfile: vi.fn() 
    },
    connect: { 
      getConnectUrl: vi.fn() 
    },
    accounts: { 
      listAccounts: vi.fn(), 
      deleteAccount: vi.fn() 
    },
  },
}));

describe("Account Sync & Zernio Profiles", () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const res = await request(app).post("/api/auth/register").send({
      name: "Sync User",
      email: `sync${Date.now()}@example.com`,
      password: "Password123",
    });
    token = res.body.data.accessToken;
    userId = res.body.data.user.id.toString();
  });

  describe("GET /api/oauth/sync/accounts", () => {
    it("should upsert accounts from Zernio", async () => {
      // 1. Setup mocks for profile lookup
      vi.mocked(zernio.profiles.listProfiles).mockResolvedValue({ 
        data: [{ _id: "prof_1", name: `workspace-${userId}` }] 
      });
      
      // 2. Setup mocks for account listing
      vi.mocked(zernio.accounts.listAccounts).mockResolvedValue({ 
        data: [
          { _id: "z_1", platform: "facebook", name: "FB Account" },
          { _id: "z_2", platform: "twitter", name: "TW Account" }
        ] 
      });

      // 3. Hit the endpoint
      const res = await request(app)
        .get("/api/oauth/sync/accounts")
        .set("Authorization", `Bearer ${token}`);
      
      // 4. Assertions
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      
      const accounts = await Account.find({ user: userId });
      expect(accounts.length).toBe(2);
    });

    it("should mark accounts as disconnected if they disappear from Zernio", async () => {
      // 1. Create an existing account in DB
      await Account.create({
        user: new mongoose.Types.ObjectId(userId),
        platform: "twitter",
        handle: "old",
        zernioAccountId: "z_old",
        status: "connected"
      });

      // 2. Mock Zernio returning an empty list (account is gone)
      vi.mocked(zernio.profiles.listProfiles).mockResolvedValue({ 
        data: [{ _id: "prof_1", name: `workspace-${userId}` }] 
      });
      vi.mocked(zernio.accounts.listAccounts).mockResolvedValue({ 
        data: [] 
      });

      // 3. Hit the endpoint
      const res = await request(app)
        .get("/api/oauth/sync/accounts")
        .set("Authorization", `Bearer ${token}`);
      
      // 4. Assertions
      expect(res.status).toBe(200);
      const updated = await Account.findOne({ user: userId, zernioAccountId: "z_old" });
      expect(updated?.status).toBe("disconnected");
    });
  });

  describe("Zernio Profile Creation", () => {
    it("should not create duplicate profiles on concurrent requests", async () => {
      // Mock profile list returning empty
      vi.mocked(zernio.profiles.listProfiles).mockResolvedValue({ data: [] });
      
      // Mock profile creation to take 100ms
      vi.mocked(zernio.profiles.createProfile).mockImplementation(() => 
        new Promise(r => setTimeout(() => r({ data: { profile: { _id: "prof_1" } } }), 100))
      );
      
      vi.mocked(zernio.accounts.listAccounts).mockResolvedValue({ data: [] });

      // Fire 2 requests at the exact same time
      const [res1, res2] = await Promise.all([
        request(app).get("/api/oauth/sync/accounts").set("Authorization", `Bearer ${token}`),
        request(app).get("/api/oauth/sync/accounts").set("Authorization", `Bearer ${token}`),
      ]);

      // Both should succeed, but Zernio profile creation should only be called ONCE
      expect(zernio.profiles.createProfile).toHaveBeenCalledTimes(1);
    });
  });
});