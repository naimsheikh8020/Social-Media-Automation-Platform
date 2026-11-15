// scripts/sync-indexes.ts
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import "../models/User.js";
import "../models/Session.js";

const main = async () => {
  await connectDB();
  for (const name of mongoose.modelNames()) {
    console.log(`syncing indexes for ${name}`);
    await mongoose.model(name).syncIndexes();
  }
  await disconnectDB();
};

main().catch((err) => { console.error(err); process.exit(1); });