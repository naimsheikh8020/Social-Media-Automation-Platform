// middleware/rateLimit.middleware.ts
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const message = { success: false, error: "Too many attempts. Try again later." };

export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Bucket by IP + email so one attacker can't lock out all users.
    // ipKeyGenerator() normalizes IPv6 to a subnet so users can't rotate
    // their address to dodge the limit.
    const ip = ipKeyGenerator(req.ip ?? "");
    const email = String(req.body?.email ?? "").toLowerCase();
    return `${ip}:${email}`;
  },
  message,
});

export const refreshRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});