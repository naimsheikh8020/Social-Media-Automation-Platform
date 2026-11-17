// services/activity.service.ts
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";
import { Account } from "../models/Account.js";

export const getUserActivity = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  // Use MongoDB Aggregation to merge Generations, Posts, and Accounts
  const activities = await Promise.all([
    // 1. Fetch Generations
    Generation.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .then((items) =>
        items.map((item) => ({
          type: "generation",
          id: item._id,
          title: "Generated AI Post",
          description: item.prompt.substring(0, 50) + "...",
          status: item.status,
          date: item.createdAt,
        }))
      ),

    // 2. Fetch Posts (Scheduled/Published)
    Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .then((items) =>
        items.map((item) => ({
          type: "post",
          id: item._id,
          title: `Post to ${item.platforms.map((p) => p.platform).join(", ")}`,
          description: item.content.substring(0, 50) + "...",
          status: item.status,
          date: item.createdAt,
        }))
      ),

    // 3. Fetch Connected Accounts
    Account.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .then((items) =>
        items.map((item) => ({
          type: "account",
          id: item._id,
          title: `Connected ${item.platform}`,
          description: `Account: @${item.handle}`,
          status: item.status,
          date: item.createdAt,
        }))
      ),
  ]);

  // Flatten the array of arrays, sort by date, and slice to limit
  const merged = activities
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return merged;
};