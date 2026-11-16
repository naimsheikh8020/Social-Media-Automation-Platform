// models/Chat.ts
import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Chat" }, // e.g., "Post about AI"
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);