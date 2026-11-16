// server.ts
import "dotenv/config";
import app from "./app.js";
import cron from "node-cron"; // 👈 Import Cron
import { connectDB, disconnectDB } from "./config/db.js";
import { reconcileStuckSchedules } from "./services/reconciliation.service.js"; // 👈 Import the worker

const PORT = Number(process.env.PORT ?? 3000);

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(JSON.stringify({ msg: "listening", port: PORT }));
    });

    // 👇 START THE RECONCILIATION CRON JOB (Every 5 minutes)
    cron.schedule("*/5 * * * *", async () => {
      console.log(JSON.stringify({ msg: "cron.running", task: "reconcileStuckSchedules" }));
      await reconcileStuckSchedules();
    });

    const shutdown = async (signal: string) => {
      console.log(JSON.stringify({ msg: "shutdown", signal }));
      
      // Stop the cron job
      cron.getTasks().forEach((task) => task.stop());

      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 15_000).unref();
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
};

startServer();