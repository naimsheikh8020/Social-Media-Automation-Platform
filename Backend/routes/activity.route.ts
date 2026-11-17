// routes/activity.route.ts
import { Router } from "express";
import { getActivity } from "../controllers/activity.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const activityRouter = Router();

activityRouter.use(requireAuth);

// GET /api/activity
activityRouter.get("/", getActivity);