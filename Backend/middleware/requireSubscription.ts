// middleware/requireSubscription.ts
import type { RequestHandler } from "express";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export const requireSubscription: RequestHandler = async (req, _res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return next(new AppError("Not authenticated", 401, "NO_TOKEN"));

    const user = await User.findById(userId);
    if (!user) return next(new AppError("User not found", 404, "USER_NOT_FOUND"));

    // 🛑 Block if no active subscription
    if (user.subscriptionStatus !== "active" || !user.subscriptionPlan) {
      return next(
        new AppError(
          "An active subscription is required to use this feature.",
          403,
          "SUBSCRIPTION_REQUIRED"
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};