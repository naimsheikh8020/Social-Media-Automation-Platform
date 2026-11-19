// app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { notFound } from "./middleware/notFound.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.route.js";
import { webhookRouter } from "./routes/webhook.route.js";
import { socialAuthRouter } from "./routes/socialAuth.route.js";
import { accountRouter } from "./routes/account.routes.js";
import { postRouter } from "./routes/post.route.js";
import { activityRouter } from "./routes/activity.route.js";
import { logger } from "./utils/logger.js";
// import { PlanTier } from "./config/plans.js";
// import stripe from "./config/stripe.js";
// import * as paymentService from "./services/payment.service.js";
import { paymentRouter } from "./routes/payment.route.js";
import paymentWebhookRouter from "./routes/paymentWebhook.js";


const app = express();

app.set("trust proxy", 1);
app.use(helmet());

app.use(
  "/api/payments/webhook",
  paymentWebhookRouter
);


app.use(express.json({ limit: "10kb" })); // Blocks massive payloads

const origins = process.env.FRONTEND_ORIGIN?.split(",") ?? [];
if (origins.length > 0) {
  app.use(cors({ origin: origins, credentials: true }));
}

app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "success",
    message: "Server is live!",
    data: null,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/webhooks", webhookRouter);
app.use("/api/oauth", socialAuthRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/posts", postRouter);
app.use("/api/activity", activityRouter);
app.use("/api/payments", paymentRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
