import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import { Account } from "../models/Account.js";
import User from "../models/User.js";
import zernio from "../config/zernio.js";

// Mock Zernio
vi.mock("../config/zernio.js", () => {
  return {
    default: {
      profiles: { listProfiles: vi.fn(), createProfile: vi.fn() },
      connect: { getConnectUrl: vi.fn() },
      accounts: { deleteAccount: vi.fn() },
    },
  };
});

describe("Accounts & OAuth API", () => {
  let token: string;
  let userId: string;

  const setupUser = async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
    });
    token = res.body.data.accessToken;
    userId = res.body.data.user.id.toString(); // Ensure string
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await setupUser();
  });

  describe("POST /api/accounts", () => {
    it("should return an OAuth URL from Zernio", async () => {
      (zernio.profiles.listProfiles as any).mockResolvedValue({ data: [] });
      (zernio.profiles.createProfile as any).mockResolvedValue({ 
        data: { profile: { _id: "zernio_prof_123" } } 
      });
      (zernio.connect.getConnectUrl as any).mockResolvedValue({ 
        data: { authUrl: "https://facebook.com/oauth/fake-link" } 
      });

      const res = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send({ platform: "facebook" });

      expect(res.status).toBe(200);
      expect(res.body.url).toBe("https://facebook.com/oauth/fake-link");
    });
  });

  describe("GET /api/accounts", () => {
    it("should list only the logged-in user's accounts", async () => {
      await Account.create({
        user: new mongoose.Types.ObjectId(userId),
        platform: "facebook",
        handle: "test-handle",
        zernioAccountId: "zernio_acc_123",
        status: "connected",
      });

      const res = await request(app)
        .get("/api/accounts")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.accounts[0].handle).toBe("test-handle");
    });
  });

  describe("DELETE /api/accounts/:id", () => {
    it("should call Zernio to delete AND mark the account as disconnected in DB", async () => {
      // 1. Create account
      const account = await Account.create({
        user: new mongoose.Types.ObjectId(userId),
        platform: "facebook",
        handle: "test-handle",
        zernioAccountId: "zernio_acc_123",
        status: "connected",
      });

      // 2. Mock Zernio delete success
      (zernio.accounts.deleteAccount as any).mockResolvedValue({ data: { success: true } });

      // 3. Hit endpoint
      const res = await request(app)
        .delete(`/api/accounts/${account._id}`)
        .set("Authorization", `Bearer ${token}`);

      // 4. Assertions
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Account disconnected successfully");

      expect(zernio.accounts.deleteAccount).toHaveBeenCalledWith({
        path: { accountId: "zernio_acc_123" },
      });

      const updated = await Account.findById(account._id);
      expect(updated?.status).toBe("disconnected");
    });

    it("should return 404 if trying to delete someone else's account", async () => {
      const otherUser = await User.create({
        name: "Other",
        email: "other@example.com",
        password: "Password123",
      });
      
      const otherAccount = await Account.create({
        user: otherUser._id,
        platform: "facebook",
        handle: "other-handle",
        zernioAccountId: "zernio_acc_999",
        status: "connected",
      });

      const res = await request(app)
        .delete(`/api/accounts/${otherAccount._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACCOUNT_NOT_FOUND");
      expect(zernio.accounts.deleteAccount).not.toHaveBeenCalled();
    });
  });
});