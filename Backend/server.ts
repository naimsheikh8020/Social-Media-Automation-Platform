// server.ts
import "dotenv/config";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";

const PORT = Number(process.env.PORT ?? 3000);

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(JSON.stringify({ msg: "listening", port: PORT }));
    });

    const shutdown = async (signal: string) => {
      console.log(JSON.stringify({ msg: "shutdown", signal }));
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