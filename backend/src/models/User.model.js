//? Importing necessary modules and models.
import mongoose from "mongoose";
import { ROLES } from "../constants/roles.constant.js";

//* Defining the User schema and model.
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null, index: true, sparse: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    isEmailVerified: { type: Boolean, default: false },
    avatarUrl: { type: String, default: "" },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
