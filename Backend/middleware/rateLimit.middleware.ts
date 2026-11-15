// middleware/rateLimit.middleware.ts
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const message = { success: false, error: "Too many attempts. Try again later." };

export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === "test", // 👈 ADD THIS
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 1. Fix the IPv6 warning
    const ip = ipKeyGenerator(req.ip ?? "");
    const email = String(req.body?.email ?? "").toLowerCase();
    return `${ip}:${email}`;
  },
  message,
});


export const refreshRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  skip: () => process.env.NODE_ENV === "test", // 👈 ADD THIS
  standardHeaders: true,
  legacyHeaders: false,
  message,
});