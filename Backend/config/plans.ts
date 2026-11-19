// config/plans.ts
export const PLANS = {
  starter: {
    name: "Starter",
    price: 1900, // $19.00
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    limits: {
      postsPerMonth: 100,
      aiGenerationsPerMonth: 500,
      connectedAccounts: 5,
    },
  },
  pro: {
    name: "Pro",
    price: 4900, // $49.00
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    limits: {
      postsPerMonth: 500,
      aiGenerationsPerMonth: 2000,
      connectedAccounts: 15,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: 9900, // $99.00
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    limits: {
      postsPerMonth: 5000,
      aiGenerationsPerMonth: 10000,
      connectedAccounts: 50,
    },
  },
} as const;

export type PlanTier = keyof typeof PLANS;