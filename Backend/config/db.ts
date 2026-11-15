
import mongoose from "mongoose";

// 1. Database configuration
const CONFIG = {
  uri: process.env.MONGODB_URI,

  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 2,

  connectRetries: 5,
  retryDelay: 1000,
};

// 2. Connection state
let connectionPromise: Promise<typeof mongoose> | null = null;
let isShuttingDown = false;

// 3. Structured logger
function log(level: "info" | "warn" | "error", message: string) {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
    })
  );
}

// 4. Wait helper
const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 5. Connect to MongoDB with retry
async function connectWithRetry(): Promise<typeof mongoose> {
  for (let attempt = 1; attempt <= CONFIG.connectRetries + 1; attempt++) {
    if (isShuttingDown) {
      throw new Error("Application is shutting down");
    }

    try {
      const db = await mongoose.connect(CONFIG.uri!, {
        maxPoolSize: CONFIG.maxPoolSize,
        minPoolSize: CONFIG.minPoolSize,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        autoIndex: false,
        retryWrites: true,
        retryReads: true,
      });

      log("info", "MongoDB connected successfully");

      return db;
    } catch (error) {
      log("error", `MongoDB connection attempt ${attempt} failed`);

      if (attempt > CONFIG.connectRetries) {
        throw error;
      }

      const delay = Math.min(
        CONFIG.retryDelay * 2 ** (attempt - 1),
        15000
      );

      await sleep(delay);
    }
  }

  throw new Error("MongoDB connection failed");
}

// 6. Main connection function
export async function connectDB(): Promise<typeof mongoose> {
  if (isShuttingDown) {
    throw new Error("Application is shutting down");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!CONFIG.uri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  connectionPromise = connectWithRetry();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

// 7. Connection monitoring
mongoose.connection.on("disconnected", () => {
  log("warn", "MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  log("info", "MongoDB reconnected");
});

mongoose.connection.on("error", (error) => {
  log("error", `MongoDB error: ${error.message}`);
});

// 8. Check database readiness
export function isDBReady(): boolean {
  return mongoose.connection.readyState === 1;
}

// 9. Ping MongoDB
export async function pingDB(): Promise<boolean> {
  if (!isDBReady() || !mongoose.connection.db) {
    return false;
  }

  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}

// 10. Disconnect database
export async function disconnectDB(): Promise<void> {
  isShuttingDown = true;

  try {
    await mongoose.disconnect();
    log("info", "MongoDB disconnected successfully");
  } catch (error) {
    log("error", "MongoDB disconnection failed");
    throw error;
  } finally {
    connectionPromise = null;
  }
}
