//? Importing necessary modules and models.
import mongoose from "mongoose";
import { INVITATION_STATUS } from "../constants/invitationStatus.constant.js";

//* Defining the WorkspaceInvite schema and model.
const schema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("WorkspaceInvite", schema);
