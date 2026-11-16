// controllers/post.controller.ts
import { Request, Response } from "express";
import * as postService from "../services/post.service.js";
import { AppError } from "../utils/AppError.js";
import { ok, created } from "../utils/response.js";
import { Post } from "../models/Post.js";

// ─────────────────────────────────────────────────────────────
// 1. Start a New Chat
// POST /api/posts/chat
// ─────────────────────────────────────────────────────────────
export const startChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const { prompt } = req.body;
    const chat = await postService.createChat(userId, prompt || "New Chat");

    created(res, { chat });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to start chat", 500, "START_CHAT_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 2. Get All Chats (Sidebar History)
// GET /api/posts/chat
// ─────────────────────────────────────────────────────────────
export const getChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const chats = await postService.getUserChats(userId);
    ok(res, { count: chats.length, chats });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch chats", 500, "FETCH_CHATS_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 3. Get Messages in a Specific Chat
// GET /api/posts/chat/:chatId/messages
// ─────────────────────────────────────────────────────────────
export const getChatMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const chatId = req.params.chatId as string;
    const messages = await postService.getChatMessages(chatId, userId);

    ok(res, { count: messages.length, messages });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch messages", 500, "FETCH_MESSAGES_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 4. Generate Post (Requires chatId)
// POST /api/posts/generate
// ─────────────────────────────────────────────────────────────
export const generatePost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const {
      chatId,
      prompt,
      tone = "professional",
      generateImg = false,
    } = req.body;

    if (!prompt || !chatId) {
      throw new AppError(
        "Prompt and chatId are required",
        400,
        "MISSING_FIELDS",
      );
    }

    const generation = await postService.createGeneration(
      userId,
      chatId,
      prompt,
      tone,
      generateImg,
    );

    created(res, { generation }, "Post generated successfully");
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to generate post", 500, "GENERATE_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 5. Get Global Generations
// GET /api/posts/generations
// ─────────────────────────────────────────────────────────────
export const getGenerations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    const generations = await postService.getUserGenerations(userId);

    ok(res, { count: generations.length, generations });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch generations", 500, "FETCH_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 6. Get Posts
// GET /api/posts
// ─────────────────────────────────────────────────────────────
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    // 👇 Clamp page and limit
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const posts = await postService.getUserPosts(userId, page, limit);

    ok(res, { count: posts.length, posts });
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch posts", 500, "FETCH_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 7. Schedule Post (Zernio)
// POST /api/posts/schedule
// ─────────────────────────────────────────────────────────────
// 7. Schedule Post (Zernio)
// POST /api/posts/schedule
// ─────────────────────────────────────────────────────────────
export const schedulePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new AppError("Not authenticated", 401, "NO_TOKEN");

    // 👇 Get the Idempotency Key from headers
    const idempotencyKey = req.headers["idempotency-key"] as string;
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key header is required", 400, "MISSING_IDEMPOTENCY_KEY");
    }

    const { content, mediaUrl, scheduledFor, timezone, platforms } = req.body;

    // 👇 Call the service with the 7 arguments
    const post = await postService.schedulePost(
      userId, 
      idempotencyKey, 
      content, 
      mediaUrl || null, 
      scheduledFor, 
      timezone, 
      platforms
    );

    created(res, { post }, "Post scheduled successfully");
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to schedule post", 500, "SCHEDULE_ERROR");
  }
};