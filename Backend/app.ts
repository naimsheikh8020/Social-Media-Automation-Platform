import express from "express";
import cors from "cors";

import { notFound } from "./middleware/notFound.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "success",
    message: "Server is live!",
    data: null,
  });
});


app.use(notFound);

// Global error handler — must be last
app.use(globalErrorHandler);

export default app;