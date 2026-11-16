// routes/post.route.ts
import { Router } from "express";
import * as postController from "../controllers/post.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { generatePostSchema, schedulePostSchema, startChatSchema } from "../utils/validators.js";

export const postRouter = Router();

postRouter.use(requireAuth);

// Chat Management
postRouter.post("/chat", validate(startChatSchema), postController.startChat);
postRouter.get("/chat", postController.getChats);
postRouter.get("/chat/:chatId/messages", postController.getChatMessages);

// AI Generation
postRouter.post("/generate", validate(generatePostSchema), postController.generatePost);

// History & Scheduling
postRouter.get("/generations", postController.getGenerations);
postRouter.post("/schedule", validate(schedulePostSchema), postController.schedulePost);
postRouter.get("/", postController.getPosts);