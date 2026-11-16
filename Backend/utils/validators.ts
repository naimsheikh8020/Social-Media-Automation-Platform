// utils/validators.ts
import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v), "Password must contain a letter")
  .refine((v) => /\d/.test(v), "Password must contain a number");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const addAccountSchema = z.object({
  platform: z.enum(
    [
      "facebook",
      "instagram",
      "twitter",
      "linkedin",
      "tiktok",
      "facebook_page",
      "instagram_business",
      "linkedin_page",
    ],
    {
      // 👇 In Zod v4, use "error" instead of "errorMap"
      error: "Invalid platform. Please choose a supported social network.",
    },
  ),
});

export const generatePostSchema = z.object({
  chatId: z.string().length(24, "Invalid Chat ID"),
  prompt: z.string().min(1, "Prompt is required").max(1000),
  tone: z.string().default("professional"),
  generateImg: z.boolean().default(false),
});

export const schedulePostSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  mediaUrl: z.string().url().nullable().optional(),
  scheduledFor: z.string().datetime(),

  // 👇 Validate Timezone
  timezone: z.string().refine((value) => {
    try {
      Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Invalid timezone"),

  platforms: z
    .array(
      z.object({
        platform: z.enum([
          "facebook",
          "instagram",
          "twitter",
          "linkedin",
          "tiktok",
        ]),
        accountId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid account ID"),
      }),
    )
    .min(1, "At least one platform is required")
    // 👇 Prevent duplicate accounts
    .refine(
      (items) =>
        new Set(items.map((item) => item.accountId)).size === items.length,
      "Duplicate accounts are not allowed",
    ),
});

export const startChatSchema = z.object({
  prompt: z.string().min(1).max(500),
});
