// tests/reconciliation.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import User from "../models/User.js";
import { reconcileStuckSchedules } from "../services/reconciliation.service.js";

describe("Reconciliation Worker", () => {
  let userId: string;

  beforeEach(async () => {
    const user = await User.create({
      name: "Recon User",
      email: `recon${Date.now()}@test.com`,
      password: "Password123",
    });
    userId = user._id.toString();
  });

  it("should mark posts stuck for >1 hour as failed", async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const post = await Post.create({
      user: userId,
      idempotencyKey: "test-key-1",
      content: "Test",
      platforms: [{ platform: "facebook", accountId: new mongoose.Types.ObjectId() }],
      status: "scheduling",
      createdAt: twoHoursAgo,
    });

    await reconcileStuckSchedules();

    const updated = await Post.findById(post._id);
    expect(updated?.status).toBe("failed");
  });

  it("should leave recent posts unchanged", async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const post = await Post.create({
      user: userId,
      idempotencyKey: "test-key-2",
      content: "Test",
      platforms: [{ platform: "facebook", accountId: new mongoose.Types.ObjectId() }],
      status: "scheduling",
      createdAt: fiveMinutesAgo,
    });

    await reconcileStuckSchedules();

    const updated = await Post.findById(post._id);
    expect(updated?.status).toBe("scheduling"); // Should still be scheduling
  });
});