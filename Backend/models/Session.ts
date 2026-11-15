// models/Session.ts
import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshTokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    lastUsedAt: { type: Date, default: Date.now },
    userAgent: { type: String, maxlength: 512 },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true, versionKey: false },
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;