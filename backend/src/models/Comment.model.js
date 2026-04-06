//? Importing necessary modules and models.
import mongoose from "mongoose";

//* Defining the Comment schema and model.
const schema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Comment", schema);
