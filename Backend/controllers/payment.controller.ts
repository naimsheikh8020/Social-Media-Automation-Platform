// controllers/payment.controller.ts
import { Request, Response } from "express";
import * as paymentService from "../services/payment.service.js";
import { AppError } from "../utils/AppError.js";
import { requireUserId } from "../utils/request.js";
import { PLANS, PlanTier } from "../config/plans.js";
import { ok } from "../utils/response.js";

// POST /api/payments/checkout
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const { planTier } = req.body as { planTier: PlanTier };

    if (!planTier || !PLANS[planTier]) {
      throw new AppError("Invalid plan selected", 400, "INVALID_PLAN");
    }

    const url = await paymentService.createStripeCheckoutSession(userId, planTier);
    
    // 👇 Consistent response format
    ok(res, { url });
    
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create checkout session", 500, "STRIPE_ERROR");
  }
};

// GET /api/payments/plans
export const getPlans = async (_req: Request, res: Response): Promise<void> => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: plan.price,
    limits: plan.limits,
  }));
  ok(res, { plans });
};