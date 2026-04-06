//? Khalti Payment model for tracking Khalti transactions.
import mongoose from "mongoose";
import { SUBSCRIPTION_PLANS } from "../constants/subscriptionPlans.constant.js";

const khaltiPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    pidx: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    purchaseOrderId: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLANS),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NPR",
    },
    status: {
      type: String,
      enum: ["initiated", "pending", "completed", "failed", "refunded", "expired", "canceled"],
      default: "initiated",
    },
    fee: {
      type: Number,
      default: 0,
    },
    periodStart: {
      type: Date,
      default: null,
    },
    periodEnd: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for looking up payments by status
khaltiPaymentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("KhaltiPayment", khaltiPaymentSchema);
