import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    mediaUrl: { type: String, default: null },
    mediaType: {
      type: String,
      enum: ["image", "video", null],
      default: null,
    },
    platform:[{
      type: String,
      enum: ["facebook", "instagram", "twitter", "linkedin","tiktok","facebook_page", "instagram_business", "linkdin_page"],
      required: true
    }],
    scheduledFor: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "failed"],
      default: "draft",
    }
  },
  { timestamps: true },
);

export const Post = mongoose.model("Post", postSchema);
