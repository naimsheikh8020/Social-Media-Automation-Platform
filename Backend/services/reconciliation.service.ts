// services/reconciliation.service.ts
import { Post } from "../models/Post.js";
import { logger } from "../utils/logger.js";

export const reconcileStuckSchedules = async () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // 1. Fail posts stuck for more than 1 hour
  await Post.updateMany(
    { status: "scheduling", createdAt: { $lte: oneHourAgo } },
    { $set: { status: "failed", errorMessage: "Timed out after 1 hour" } }
  );

  // 2. Log posts stuck for 10-60 minutes
  const stuckPosts = await Post.find({
    status: "scheduling",
    createdAt: { $lte: tenMinutesAgo, $gt: oneHourAgo },
  });

  for (const post of stuckPosts) {
    const ageInMinutes = Math.round((Date.now() - post.createdAt.getTime()) / 60000);
    logger.warn(`RECONCILE: Post ${post._id} stuck for ${ageInMinutes}m.`);
  }
};