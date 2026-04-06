//? Importing necessary modules and models.
import mongoose from "mongoose";

//* Defining the Notification schema and model.
const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} },

    readAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", schema);
