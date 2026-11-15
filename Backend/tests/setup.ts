// tests/setup.ts
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

beforeAll(async () => {
  const uri = process.env.MONGODB_TEST_URI;
  if (!uri) {
    throw new Error("MONGODB_TEST_URI is missing. Add it to your .env file.");
  }

  // Connect to the test database on Atlas
  await mongoose.connect(uri);
  
  // Sync indexes
  const { default: User } = await import("../models/User.js");
  const { default: Session } = await import("../models/Session.js");
  await User.syncIndexes();
  await Session.syncIndexes();
});

afterEach(async () => {
  // Clear data after every single test so they don't conflict
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  // Close the connection when finished
  await mongoose.disconnect();
});