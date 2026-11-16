// services/account.service.ts
import mongoose from "mongoose";
import { Account } from "../models/Account.js";

// ─────────────────────────────────────────────────────────────
// 1. Get all accounts for a specific user
// ─────────────────────────────────────────────────────────────
export const getUserAccounts = async (userId: string) => {
  return await Account.find({ 
    user: new mongoose.Types.ObjectId(userId) 
  }).sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────────────────────
// 2. Find a specific account (used for deleting)
// ─────────────────────────────────────────────────────────────
export const findUserAccount = async (accountId: string, userId: string) => {
  return await Account.findOne({ 
    _id: new mongoose.Types.ObjectId(accountId), 
    user: new mongoose.Types.ObjectId(userId) 
  });
};

// ─────────────────────────────────────────────────────────────
// 3. Mark an account as disconnected (Soft Delete)
// ─────────────────────────────────────────────────────────────
export const markAccountDisconnected = async (account: any) => {
  account.status = "disconnected";
  await account.save();
  return account;
};