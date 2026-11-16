// services/reconciliation.service.ts
import { Post } from "../models/Post.js";
import { logger } from "../utils/logger.js";

export const reconcileStuckSchedules = async () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const stuckPosts = await Post.find({
    status: "scheduling",
    createdAt: { $lte: tenMinutesAgo },
  });

  if (stuckPosts.length === 0) return;

  // 👇 Log the total count
  logger.warn(`Reconciliation: Found ${stuckPosts.length} stuck posts.`);

  for (const post of stuckPosts) {
    // 👇 Calculate how many minutes it has been stuck
    const ageInMinutes = Math.round((Date.now() - post.createdAt.getTime()) / 60000);

    logger.error(`MANUAL CHECK NEEDED: Post ${post._id} stuck for ${ageInMinutes} minutes. Check Zernio dashboard.`, {
      userId: post.user,
      contentSnippet: post.content.substring(0, 30),
    });
  }
};