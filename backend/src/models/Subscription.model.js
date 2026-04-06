//? Importing necessary modules and models.
import mongoose from "mongoose";
import { SUBSCRIPTION_PLANS } from "../constants/subscriptionPlans.constant.js";

//* Defining the Subscription schema and model.
const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLANS),
      default: SUBSCRIPTION_PLANS.FREE,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "trialing", "incomplete"],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
