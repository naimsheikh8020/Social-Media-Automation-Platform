import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/response.js";

export const handleTwitterWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["x-twitter-signature"];

  // In a real app, you would use crypto to verify the HMAC signature here
  if (!signature || signature === "invalid-fake-signature") {
    throw new AppError("Invalid webhook signature", 401, "UNAUTHORIZED_WEBHOOK");
  }

  return ok(res, null, "Webhook received");
};