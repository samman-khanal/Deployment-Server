//? Importing necessary modules and models.
import mongoose from "mongoose";

//* Defining the Workspace schema and model.
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Workspace", schema);
