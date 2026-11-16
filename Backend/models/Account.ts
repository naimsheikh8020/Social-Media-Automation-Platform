// import mongoose from "mongoose";


// const accountSchema = new mongoose.Schema({
//   user:{ type: mongoose.Schema.Types.ObjectId, ref: "User",required: true },
//   platform: { type: String, enum: ["facebook", "instagram", "twitter", "linkedin","tiktok","facebook_page", "instagram_business", "linkdin_page"], required: true },
//   handle: { type: String, required: true },
//   zernioAccountId: { type: String, required: true },
//   accessToken: { type: String, required: true },
//   refreshToken: { type: String, required: true },
//   tokenExpiresAt: { type: Date, required: true },
//   Status: { type: String, enum: ["connected", "disconnected"], default: "connected" },
//   avatarUrl: { type: String },
// },{ timestamps: true });

// export const Account = mongoose.model("Account", accountSchema);


import mongoose, { Schema, InferSchemaType } from "mongoose";

const accountSchema = new Schema(
  {
    // 1. Who owns this connection?
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 2. Which platform is it?
    platform: {
      type: String,
      enum: [
        "facebook",
        "instagram",
        "twitter",
        "linkedin",
        "tiktok",
        "facebook_page",
        "instagram_business",
        "linkedin_page",
      ],
      required: true,
    },

    // 3. Zernio's internal ID for this account
    // This is the ONLY token/id we need to store.
    zernioAccountId: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate connections
      sparse: true,
      index: true,
    },

    // 4. Human-readable info (for the frontend dashboard)
    handle: { type: String, required: true },
    avatarUrl: { type: String },

    // 5. Status management
    status: {
      type: String,
      enum: ["connected", "disconnected"],
      default: "connected",
    },
  },
  { timestamps: true, versionKey: false }
);

export type AccountDoc = InferSchemaType<typeof accountSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Account = mongoose.model("Account", accountSchema);