
import mongoose, { Schema, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },

    zernioProfileId: {
      type: String,
      trim: true,
      default: null,
    },

    // Subscription fields
    subscriptionPlan: {
      type: String,
      enum: ["starter", "pro", "enterprise", null],
      default: null,
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "trialing",
        "unpaid",
        "paused",
        null,
      ],
      default: null,
    },

    stripeCustomerId: {
      type: String,
      default: null,
    },

    stripeSubscriptionId: {
      type: String,
      default: null,
    },

    subscriptionEndsAt: {
      type: Date,
      default: null,
    },

    // Usage tracking
    usage: {
      postsThisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },

      aiGenerationsThisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },

      connectedAccounts: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    lastUsageReset: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

const User = mongoose.model("User", userSchema);

export default User;
