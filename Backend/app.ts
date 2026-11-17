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

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "10kb" })); // Blocks massive payloads

const origins = process.env.FRONTEND_ORIGIN?.split(",") ?? [];
if (origins.length > 0) {
  app.use(cors({ origin: origins, credentials: true }));
}

app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, status: "success", message: "Server is live!", data: null });
});

app.use("/api/auth", authRouter);
app.use("/api/webhooks", webhookRouter); 
app.use("/api/oauth", socialAuthRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/posts", postRouter); 




app.use(notFound);
app.use(globalErrorHandler);

export default app;