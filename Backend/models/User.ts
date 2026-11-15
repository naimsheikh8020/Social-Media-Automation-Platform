// models/User.ts
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
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    password: { type: String, required: [true, "Password is required"], select: false },
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    zernioProfileId: { type: String, trim: true, default: null },
  },
  { timestamps: true, versionKey: false },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

const User = mongoose.model("User", userSchema);
export default User;