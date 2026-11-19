// services/payment.service.ts
import stripe from "../config/stripe.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { PLANS, PlanTier } from "../config/plans.js";

// ─────────────────────────────────────────────────────────────
// 1. Create Checkout Session
// ─────────────────────────────────────────────────────────────
export const createStripeCheckoutSession = async (
  userId: string,
  planTier: PlanTier
) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const plan = PLANS[planTier];
    if (!plan?.priceId) {
      throw new AppError(`Price ID for ${planTier} is not configured`, 500, "CONFIG_ERROR");
    }

    // Create or reuse Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: userId },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: { userId: userId, planTier: planTier },
      },
    });

    if (!session.url) {
      throw new AppError("Stripe failed to return a checkout URL", 500, "STRIPE_ERROR");
    }

    return session.url;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Stripe Checkout Error: ${error.message}`, 500, "STRIPE_ERROR");
  }
};

// ─────────────────────────────────────────────────────────────
// 2. Handle Successful Payment (Webhook)
// ─────────────────────────────────────────────────────────────


export const handleSuccessfulPayment = async (
  userId: string,
  subscriptionId: string
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(
        `User not found: ${userId}`,
        404,
        "USER_NOT_FOUND"
      );
    }

    // Retrieve the actual subscription from Stripe
    const subscription =
      await stripe.subscriptions.retrieve(subscriptionId);

    // Verify that this subscription belongs to this user
    if (subscription.metadata.userId !== userId) {
      throw new Error("Stripe subscription user ID mismatch");
    }

    // Get the plan from subscription metadata
    const planTier = subscription.metadata.planTier as PlanTier;

    if (!Object.prototype.hasOwnProperty.call(PLANS, planTier)) {
      throw new Error(`Invalid subscription plan: ${planTier}`);
    }

    const plan = PLANS[planTier];

    // Verify that the subscription contains the expected Stripe Price
    const subscriptionItem = subscription.items.data.find(
      (item) => item.price.id === plan.priceId
    );

    if (!subscriptionItem) {
      throw new Error(
        `Stripe subscription does not contain the expected price for ${planTier}`
      );
    }

    // Newer Stripe API versions expose current_period_end
    // on the subscription item.
    const currentPeriodEnd = (
      subscriptionItem as unknown as {
        current_period_end?: number;
      }
    ).current_period_end;

    if (
      typeof currentPeriodEnd !== "number" ||
      !Number.isFinite(currentPeriodEnd)
    ) {
      throw new Error(
        "Stripe subscription item has no valid current_period_end"
      );
    }

    const subscriptionEndsAt = new Date(currentPeriodEnd * 1000);

    if (Number.isNaN(subscriptionEndsAt.getTime())) {
      throw new Error("Invalid subscription end date from Stripe");
    }

    // Update subscription information
    user.subscriptionPlan = planTier;
    user.subscriptionStatus = subscription.status as any;
    user.stripeSubscriptionId = subscription.id;
    user.subscriptionEndsAt = subscriptionEndsAt;

    // Do not reset usage counters on webhook retries.
    await user.save();

    logger.info("Subscription successfully saved", {
      userId,
      subscriptionId,
      planTier,
      status: subscription.status,
      subscriptionEndsAt: subscriptionEndsAt.toISOString(),
    });

    return user;
  } catch (error: any) {
    logger.error(`Failed to process payment for user ${userId}`, {
      error: error.message,
      subscriptionId,
    });

    throw error;
  }
};



// ─────────────────────────────────────────────────────────────
// 3. Handle Subscription Cancellation
// ─────────────────────────────────────────────────────────────
export const handleSubscriptionCanceled = async (subscriptionId: string) => {
  try {
    const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
    if (!user) {
      logger.warn(`Canceled subscription ${subscriptionId} not found in DB`);
      return;
    }

    user.subscriptionStatus = "canceled";
    user.subscriptionPlan = null;
    await user.save();
    
    logger.info(`User ${user._id} downgraded due to cancellation`);
  } catch (error: any) {
    logger.error(`Failed to handle cancellation: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────
// 4. Check Usage Limits
// ─────────────────────────────────────────────────────────────
export const checkUsageLimit = async (
  userId: string,
  action: "aiGeneration" | "post" | "account"
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  if (user.subscriptionStatus !== "active" || !user.subscriptionPlan) {
    throw new AppError("Active subscription required", 403, "SUBSCRIPTION_REQUIRED");
  }

  const plan = PLANS[user.subscriptionPlan as PlanTier];

  if (!user.usage) {
    user.usage = { postsThisMonth: 0, aiGenerationsThisMonth: 0, connectedAccounts: 0 };
  }

  const lastReset = new Date(user.lastUsageReset);
  const now = new Date();
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    user.usage.postsThisMonth = 0;
    user.usage.aiGenerationsThisMonth = 0;
    user.lastUsageReset = now;
    await user.save();
  }

  if (action === "aiGeneration" && user.usage.aiGenerationsThisMonth >= plan.limits.aiGenerationsPerMonth) {
    throw new AppError(`You've reached your ${plan.name} limit of ${plan.limits.aiGenerationsPerMonth} AI generations. Upgrade to continue.`, 403, "USAGE_LIMIT_REACHED");
  }
  
  if (action === "post" && user.usage.postsThisMonth >= plan.limits.postsPerMonth) {
    throw new AppError(`You've reached your ${plan.name} limit of ${plan.limits.postsPerMonth} posts. Upgrade to continue.`, 403, "USAGE_LIMIT_REACHED");
  }
  
  if (action === "account" && user.usage.connectedAccounts >= plan.limits.connectedAccounts) {
    throw new AppError(`You've reached your ${plan.name} limit of ${plan.limits.connectedAccounts} connected accounts. Upgrade to continue.`, 403, "USAGE_LIMIT_REACHED");
  }

  return true;
};

// ─────────────────────────────────────────────────────────────
// 5. Increment Usage
// ─────────────────────────────────────────────────────────────
export const incrementUsage = async (
  userId: string,
  action: "aiGeneration" | "post" | "account"
) => {
  const field =
    action === "aiGeneration" ? "usage.aiGenerationsThisMonth" :
    action === "post" ? "usage.postsThisMonth" :
    "usage.connectedAccounts";

  await User.findByIdAndUpdate(userId, { $inc: { [field]: 1 } });
};