// routes/post.route.ts
import { Router } from "express";
import * as postController from "../controllers/post.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { generatePostSchema, schedulePostSchema, startChatSchema } from "../utils/validators.js";
import { requireSubscription } from "../middleware/requireSubscription.js";

export const postRouter = Router();

// 1. Everyone must be logged in
postRouter.use(requireAuth);

// 2. Everyone must have an active subscription for AI features
postRouter.use(requireSubscription);

// Chat Management
postRouter.post("/chat", validate(startChatSchema), postController.startChat);
postRouter.get("/chat", postController.getChats);
postRouter.get("/chat/:chatId/messages", postController.getChatMessages);

// AI Generation
postRouter.post("/generate", validate(generatePostSchema), postController.generatePost);

// History & Scheduling
postRouter.get("/generations", postController.getGenerations);
postRouter.post("/schedule", validate(schedulePostSchema), postController.schedulePost);

// Get Posts (Now protected too)
postRouter.get("/", postController.getPosts); 