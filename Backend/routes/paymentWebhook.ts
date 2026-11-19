
import express, { Request, Response } from "express";
import Stripe from "stripe";

import stripe from "../config/stripe.js";
import User from "../models/User.js";
import { PLANS, PlanTier } from "../config/plans.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Get the subscription ID from a Stripe invoice.
// Supports both older and newer Stripe invoice structures.
const getInvoiceSubscriptionId = (invoice: any): string | null => {
  const subscription =
    invoice.subscription ??
    invoice.parent?.subscription_details?.subscription;

  if (typeof subscription === "string") {
    return subscription;
  }

  if (subscription && typeof subscription === "object") {
    return subscription.id ?? null;
  }

  return null;
};

// Safely extract the subscription period end.
const getSubscriptionEndDate = (
  subscription: Stripe.Subscription
): Date => {
  const items = subscription.items.data;

  if (!items.length) {
    throw new Error("Stripe subscription has no subscription items");
  }

  const periodEnds = items
    .map((item) => {
      return (
        item as unknown as {
          current_period_end?: number;
        }
      ).current_period_end;
    })
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    );

  if (!periodEnds.length) {
    throw new Error(
      "No valid current_period_end found on Stripe subscription items"
    );
  }

  // Use the earliest item end date to avoid granting access
  // beyond the first item that expires.
  const endTimestamp = Math.min(...periodEnds);
  const endDate = new Date(endTimestamp * 1000);

  if (Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid subscription end date");
  }

  return endDate;
};

// Find and validate the user and plan from a Stripe subscription.
const syncSubscription = async (
  subscriptionId: string,
  expectedUserId?: string
) => {
  const subscription =
    await stripe.subscriptions.retrieve(subscriptionId);

  const userId = subscription.metadata.userId;

  if (!userId) {
    throw new Error(
      `Missing userId metadata on subscription ${subscriptionId}`
    );
  }

  if (expectedUserId && expectedUserId !== userId) {
    throw new Error("Checkout user ID does not match subscription metadata");
  }

  const planTier = subscription.metadata.planTier as PlanTier;

  if (!Object.prototype.hasOwnProperty.call(PLANS, planTier)) {
    throw new Error(`Invalid planTier in Stripe metadata: ${planTier}`);
  }

  const plan = PLANS[planTier];

  const matchingItem = subscription.items.data.find(
    (item) => item.price.id === plan.priceId
  );

  if (!matchingItem) {
    throw new Error(
      `Subscription price does not match configured ${planTier} plan`
    );
  }

  const subscriptionEndsAt = getSubscriptionEndDate(subscription);

  const user = await User.findById(userId);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Update from Stripe's actual subscription state.
  user.subscriptionPlan = planTier;
  user.subscriptionStatus = subscription.status as any;
  user.stripeSubscriptionId = subscription.id;
  user.subscriptionEndsAt = subscriptionEndsAt;

  await user.save();

  logger.info("Subscription synchronized", {
    userId,
    subscriptionId,
    planTier,
    status: subscription.status,
    subscriptionEndsAt: subscriptionEndsAt.toISOString(),
  });

  return subscription;
};

// Find a user's subscription and update its status after invoice events.
const updateSubscriptionStatus = async (
  subscriptionId: string,
  status: "active" | "past_due"
) => {
  const subscription =
    await stripe.subscriptions.retrieve(subscriptionId);

  const userId = subscription.metadata.userId;

  if (!userId) {
    throw new Error("Subscription is missing userId metadata");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  if (user.stripeSubscriptionId !== subscriptionId) {
    throw new Error("Subscription does not match the user's saved subscription");
  }

  // Use Stripe's actual status rather than assuming payment succeeded.
  user.subscriptionStatus =
    status === "active"
      ? (subscription.status as any)
      : "past_due";

  await user.save();

  logger.info("Subscription payment status updated", {
    userId,
    subscriptionId,
    status: user.subscriptionStatus,
  });
};

// Stripe webhook endpoint.
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET is missing");
      return res.status(500).json({
        received: false,
        message: "Webhook configuration error",
      });
    }

    if (typeof signature !== "string") {
      return res.status(400).send("Missing Stripe signature");
    }

    let event: Stripe.Event;

    // 1. Verify Stripe signature.
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (error: any) {
      logger.error("Stripe webhook signature verification failed", {
        error: error.message,
      });

      return res.status(400).send(
        `Webhook Error: ${error.message}`
      );
    }

    // 2. Process the event.
    try {
      logger.info("Stripe webhook received", {
        eventId: event.id,
        eventType: event.type,
      });

      switch (event.type) {
        // Checkout completed.
        case "checkout.session.completed": {
          const session =
            event.data.object as Stripe.Checkout.Session;

          const userId = session.client_reference_id;

          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          if (!userId || !subscriptionId) {
            throw new Error(
              "Checkout session is missing userId or subscriptionId"
            );
          }

          await syncSubscription(subscriptionId, userId);

          break;
        }

        // Subscription updated.
        case "customer.subscription.updated": {
          const subscription =
            event.data.object as Stripe.Subscription;

          await syncSubscription(subscription.id);

          break;
        }

        // Subscription deleted.
        case "customer.subscription.deleted": {
          const subscription =
            event.data.object as Stripe.Subscription;

          const user = await User.findOne({
            stripeSubscriptionId: subscription.id,
          });

          if (!user) {
            logger.warn("Canceled subscription user not found", {
              subscriptionId: subscription.id,
            });
            break;
          }

          user.subscriptionStatus = "canceled";
          user.subscriptionPlan = null;
          user.subscriptionEndsAt = getSubscriptionEndDate(subscription);

          await user.save();

          logger.info("Subscription canceled", {
            userId: user._id.toString(),
            subscriptionId: subscription.id,
          });

          break;
        }

        // Invoice successfully paid.
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;

          const subscriptionId =
            getInvoiceSubscriptionId(invoice);

          if (!subscriptionId) {
            logger.info("Paid invoice has no subscription", {
              invoiceId: invoice.id,
            });
            break;
          }

          await updateSubscriptionStatus(
            subscriptionId,
            "active"
          );

          break;
        }

        // Invoice payment failed.
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;

          const subscriptionId =
            getInvoiceSubscriptionId(invoice);

          if (!subscriptionId) {
            logger.info("Failed invoice has no subscription", {
              invoiceId: invoice.id,
            });
            break;
          }

          await updateSubscriptionStatus(
            subscriptionId,
            "past_due"
          );

          break;
        }

        default: {
          logger.info("Unhandled Stripe event", {
            eventType: event.type,
          });
        }
      }

      return res.status(200).json({
        received: true,
      });
    } catch (error: any) {
      logger.error("Stripe webhook processing failed", {
        eventId: event.id,
        eventType: event.type,
        error: error.message,
      });

      // Stripe retries failed webhook deliveries.
      return res.status(500).json({
        received: false,
        message: "Webhook processing failed",
      });
    }
  }
);

export default router;
