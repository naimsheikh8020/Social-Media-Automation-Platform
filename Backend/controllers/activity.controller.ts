// controllers/activity.controller.ts
import { Request, Response } from "express";
import * as activityService from "../services/activity.service.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/response.js";

// GET /api/activity
export const getActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    // Pagination (Clamped)
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const activities = await activityService.getUserActivity(userId, page, limit);

    ok(res, { count: activities.length, activities });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch activity", 500, "ACTIVITY_ERROR");
  }
};