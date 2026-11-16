import mongoose, { Schema, InferSchemaType } from "mongoose";

const generationSchema = new Schema(
  {
    // 🔗 Who owns this generation?
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast lookups by user
    },

    // 🔗 Which social account is this for? (Optional until published)
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    // 📝 Content
    prompt: { type: String, required: true },
    content: { type: String, required: true },
    
    // 🖼️ Media
    mediaUrl: { type: String, default: null },
    mediaType: { 
      type: String, 
      enum: ["image", "video", null], 
      default: null 
    },
    
    // 🎨 Style
    tone: { 
      type: String, 
      default: "professional" 
    },
     chat: { 
      type: Schema.Types.ObjectId, 
      ref: "Chat", 
      required: true, 
      index: true 
    },

    // 🚦 Status (Crucial for the dashboard UI)
    status: {
      type: String,
      enum: ["draft", "generating", "scheduled", "published", "failed"],
      default: "generating",
      index: true,
    },

    // 🕒 When should it be posted?
    scheduledFor: { 
      type: Date, 
      default: null 
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound index for fast "Get all my published posts" queries
generationSchema.index({ user: 1, status: 1, createdAt: -1 });

export type GenerationDoc = InferSchemaType<typeof generationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Generation = mongoose.model("Generation", generationSchema);