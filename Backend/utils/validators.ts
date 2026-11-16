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
    }
  ),
});