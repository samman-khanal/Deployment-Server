//? Importing necessary modules and models.
import mongoose from "mongoose";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";

//* Defining the WorkspaceMember schema and model.
const schema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(WORKSPACE_ROLES),
      default: WORKSPACE_ROLES.MEMBER,
    },
  },
  { timestamps: true },
);

schema.index({ workspace: 1, user: 1 }, { unique: true });

export default mongoose.model("WorkspaceMember", schema);
