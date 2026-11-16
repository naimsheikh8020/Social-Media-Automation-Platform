// services/post.service.ts
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";
import { Chat } from "../models/Chat.js";
import * as aiService from "./ai.service.js";
import * as zernioService from "./zernio.service.js";
import { AppError } from "../utils/AppError.js";
import { Account } from "../models/Account.js";

// ─────────────────────────────────────────────────────────────
// 1. Chat Session Management
// ─────────────────────────────────────────────────────────────

export const createChat = async (userId: string, firstPrompt: string) => {
  const title =
    firstPrompt.length > 30
      ? firstPrompt.substring(0, 30) + "..."
      : firstPrompt;

  return await Chat.create({
    user: userId,
    title: title || "New Chat",
  });
};

export const getUserChats = async (userId: string) => {
  return await Chat.find({ user: userId }).sort({ updatedAt: -1 });
};

export const getChatMessages = async (chatId: string, userId: string) => {
  return await Generation.find({ chat: chatId, user: userId }).sort({
    createdAt: 1,
  });
};

// ─────────────────────────────────────────────────────────────
// 2. Generate AI Content & Save to History
// ─────────────────────────────────────────────────────────────
export const createGeneration = async (
  userId: string,
  chatId: string,
  prompt: string,
  tone: string,
  generateImg: boolean,
) => {
  try {
    // 🛑 SECURITY CHECK: Does this chat belong to this user?
    const chat = await Chat.findOne({ _id: chatId, user: userId });
    if (!chat) {
      throw new AppError(
        "Chat not found or you don't have permission",
        404,
        "CHAT_NOT_FOUND",
      );
    }
    
    // 1. Fetch previous messages for context
    const previousMessages = await Generation.find({
      chat: chatId,
      user: userId,
    })
      .sort({ createdAt: -1 }) // Get newest first
      .limit(10)               // Only get 10
      .lean();

    // 2. Build context (Reverse to chronological order, limit total chars)
    const MAX_CONTEXT_CHARS = 12000;
    const chatContext = previousMessages
      .reverse()
      .map((msg) => `User: ${msg.prompt}\nAI: ${msg.content}`)
      .join("\n\n")
      .slice(-MAX_CONTEXT_CHARS);

    // 3. Generate Text with Context
    const content = await aiService.generateText(prompt, tone, chatContext);

    let mediaUrl = null;
    let mediaType: "image" | "video" | null = null;

    // 4. Generate Image (if requested)
    if (generateImg) {
      mediaUrl = await aiService.generateImage(prompt);
      mediaType = "image";
    }

    // 5. Save to Database
    const generation = await Generation.create({
      user: userId,
      chat: chatId, 
      prompt,
      content,
      mediaUrl,
      mediaType,
      tone,
      status: "draft",
    });

    // 6. Bump Chat to top of sidebar
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

    return generation;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Failed to generate content: ${error.message}`,
      500,
      "AI_ERROR",
    );
  }
};

// ─────────────────────────────────────────────────────────────
// 3. Fetch Generation History (Global)
// ─────────────────────────────────────────────────────────────
export const getUserGenerations = async (userId: string) => {
  return await Generation.find({ user: userId }).sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────────────────────
// 4. Fetch Scheduled/Published Posts
// ─────────────────────────────────────────────────────────────
export const getUserPosts = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// ─────────────────────────────────────────────────────────────
// 5. Schedule Post via Zernio (Outbox + Idempotency + Sanitized Errors)
// ─────────────────────────────────────────────────────────────
export const schedulePost = async (
  userId: string,
  idempotencyKey: string,
  content: string,
  mediaUrl: string | null,
  scheduledFor: string,
  timezone: string,
  platforms: { platform: string; accountId: string }[]
) => {
  // 1. Validate the date
  const scheduledDate = new Date(scheduledFor);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw new AppError("Invalid scheduled date", 400, "INVALID_DATE");
  }
  if (scheduledDate.getTime() <= Date.now()) {
    throw new AppError("Scheduled date must be in the future", 400, "PAST_SCHEDULE_DATE");
  }

  // 2. Security Checks
  const accountIds = platforms.map((p) => p.accountId);
  if (new Set(accountIds).size !== accountIds.length) {
    throw new AppError("Duplicate accounts are not allowed", 400, "DUPLICATE_ACCOUNTS");
  }

  const userAccounts = await Account.find({
    _id: { $in: accountIds },
    user: userId,
    status: "connected",
  }).lean();

  if (userAccounts.length !== accountIds.length) {
    throw new AppError("One or more accounts are invalid or disconnected", 403, "INVALID_ACCOUNTS");
  }

  const accountMap = new Map(userAccounts.map((acc) => [acc._id.toString(), acc]));
  for (const platform of platforms) {
    const account = accountMap.get(platform.accountId);
    if (!account || account.platform !== platform.platform) {
      throw new AppError("Selected platform does not match the connected account", 400, "PLATFORM_MISMATCH");
    }
  }

  // 3. Save to MongoDB FIRST (Status: scheduling)
  let post;
  try {
    post = await Post.create({
      user: userId,
      idempotencyKey,
      content,
      mediaUrl,
      platforms,
      scheduledFor: scheduledDate,
      timezone,
      status: "scheduling",
    });
  } catch (error: any) {
    // 👇 FIX 1: Handle duplicate idempotency keys gracefully
    if (error.code === 11000) {
      const existingPost = await Post.findOne({ user: userId, idempotencyKey });
      if (existingPost) {
        return existingPost; // Return the already-scheduled post safely
      }
    }
    throw error;
  }

  try {
    // 4. Call Zernio
    const zernioPost = await zernioService.schedulePost({
      content, mediaUrl, scheduledFor, timezone, platforms,
    });

    if (!zernioPost?._id) {
      throw new Error("Invalid response from Zernio");
    }

    // 5. Update MongoDB with Zernio ID
    post.zernioPostId = zernioPost._id;
    post.status = "scheduled";
    await post.save();

    return post;

  } catch (error: any) {
    // 👇 FIX 2: Log raw error internally, but save sanitized error to DB
    console.error("Zernio Scheduling Error:", error);
    
    post.status = "failed";
    post.errorMessage = "Failed to schedule post with provider. Please try again or contact support.";
    await post.save();
    
    throw new AppError("Failed to schedule post", 500, "SCHEDULE_ERROR");
  }
};