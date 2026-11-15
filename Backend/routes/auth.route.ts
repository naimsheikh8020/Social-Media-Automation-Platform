// routes/auth.route.ts
import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { registerRateLimiter, loginRateLimiter, refreshRateLimiter } from "../middleware/rateLimit.middleware.js";
import { registerSchema, loginSchema } from "../utils/validators.js";
import * as authController from "../controllers/authController.js";


export const authRouter = Router();

authRouter.post("/register", registerRateLimiter, validate(registerSchema), authController.registerUser);
authRouter.post("/login", loginRateLimiter, validate(loginSchema), authController.loginUser);
authRouter.post("/refresh", refreshRateLimiter, authController.refreshToken);
authRouter.post("/logout", authController.logoutUser);
authRouter.post("/logout-all", requireAuth, authController.logoutAll);
authRouter.get("/me", requireAuth, authController.getMe);