//? Importing necessary modules and models.
import mongoose from "mongoose";

//* Defining the Message schema and model.
const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    mimeType: String,
    size: Number,
    dataBase64: String, // demo storage; replace with URL for Cloudinary/S3
  },
  { _id: false },
);

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      index: true,
      default: null,
    },
    dm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DMConversation",
      index: true,
      default: null,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, default: "" },

    attachments: { type: [attachmentSchema], default: [] },
    reactions: { type: [reactionSchema], default: [] },
    mentions: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Message", schema);
