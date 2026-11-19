// routes/payment.route.ts
import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const paymentRouter = Router();

// Public
paymentRouter.get("/plans", paymentController.getPlans);

// Protected
paymentRouter.use(requireAuth);
paymentRouter.post("/checkout", paymentController.createCheckoutSession);