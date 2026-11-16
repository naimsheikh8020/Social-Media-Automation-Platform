// models/Post.ts
import mongoose, { Schema, InferSchemaType } from "mongoose";

const postSchema = new Schema(
  {
    // 🔗 Who owns this post?
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },

    // 🔑 IDEMPOTENCY KEY (Prevents double-clicks)
    idempotencyKey: { 
      type: String, 
      required: true, 
      // unique: true, // 🛑 Database-level protection
      index: true 
    },

    // 📝 Content
    content: { type: String, required: true },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ["image", "video", null], default: null },
    
    // 🌐 Platforms
    platforms: [
      {
        platform: {
          type: String,
          enum: [
            "facebook", "instagram", "twitter", "linkedin", "tiktok",
            "facebook_page", "instagram_business", "linkedin_page",
          ],
          required: true,
        },
        accountId: {
          type: Schema.Types.ObjectId,
          ref: "Account",
          required: true,
        },
      },
    ],

    // 🔗 Zernio Tracking
    zernioPostId: { type: String, default: null, index: true },
    
    // 🕒 Scheduling
    scheduledFor: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },

    // 🚦 Status (Includes 'scheduling' for Outbox Pattern)
    status: {
      type: String,
      enum: ["draft", "scheduling", "scheduled", "published", "failed"],
      default: "draft",
      index: true,
    },
    
    // 🛑 Error tracking
    errorMessage: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Compound index for fast dashboard queries
postSchema.index({ user: 1, status: 1, createdAt: -1 });

export type PostDoc = InferSchemaType<typeof postSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Post = mongoose.model("Post", postSchema);