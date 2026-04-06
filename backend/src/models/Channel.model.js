//? Importing necessary modules and models.
import mongoose from "mongoose";

//* Defining the Channel schema and model.
const schema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // For public channels you can still store members; for private channels this is required
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

schema.index({ workspace: 1, name: 1 }, { unique: true });

export default mongoose.model("Channel", schema);
