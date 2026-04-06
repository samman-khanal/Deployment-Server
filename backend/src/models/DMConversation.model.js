//? Importing necessary modules and models.
import mongoose from "mongoose";

//* Defining the DMConversation schema and model.
const schema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Non-unique index for query performance (uniqueness enforced in service layer)
schema.index({ workspace: 1, participants: 1 });

// Drop the old unique index if it exists (one-time migration)
const DMConversation = mongoose.model("DMConversation", schema);
DMConversation.collection
  .dropIndex("workspace_1_participants_1")
  .catch(() => {/* index may not exist or already dropped */});

export default DMConversation;
