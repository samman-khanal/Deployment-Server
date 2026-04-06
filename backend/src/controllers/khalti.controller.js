//? Khalti controller for handling Khalti payment requests.
import * as khaltiService from "../services/khalti.service.js";
import * as subscriptionService from "../services/subscription.service.js";
import KhaltiPayment from "../models/KhaltiPayment.model.js";
import Subscription from "../models/Subscription.model.js";
import User from "../models/User.model.js";
import { HTTP } from "../constants/httpStatus.constant.js";
import { SUBSCRIPTION_PLANS, PLAN_LIMITS } from "../constants/subscriptionPlans.constant.js";

//* Initiate Khalti payment for subscription upgrade.
export const initiateKhaltiPayment = async (req, res, next) => {
  try {
    const { planId, returnUrl, websiteUrl } = req.body;
    const userId = req.user._id;

    // Validate plan
    if (!planId || planId === SUBSCRIPTION_PLANS.FREE) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "Invalid plan selected",
      });
    }

    if (planId !== SUBSCRIPTION_PLANS.PLUS && planId !== SUBSCRIPTION_PLANS.PRO) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "Unsupported plan selected",
      });
    }

    if (!returnUrl || !websiteUrl) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "returnUrl and websiteUrl are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTP.NOT_FOUND).json({
        error: "User not found",
      });
    }

    // Get or create subscription
    let subscription = await subscriptionService.getUserSubscription(userId);

    // Get price in NPR
    const amountNPR = khaltiService.getPlanPriceNPR(planId);
    if (amountNPR <= 0) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "Invalid plan price",
      });
    }

    // Generate unique order ID
    const purchaseOrderId = khaltiService.generateOrderId(userId, planId);
    const planName = PLAN_LIMITS[planId].name;

    // Initiate Khalti payment
    const paymentResponse = await khaltiService.initiatePayment({
      amount: amountNPR,
      purchaseOrderId,
      purchaseOrderName: `${planName} Plan - Monthly`,
      returnUrl,
      websiteUrl,
      customerInfo: {
        name: user.fullName,
        email: user.email,
        phone: user.phone || "",
      },
    });

    // Create Khalti payment record
    await KhaltiPayment.create({
      user: userId,
      subscription: subscription._id,
      pidx: paymentResponse.pidx,
      purchaseOrderId,
      planId,
      amount: amountNPR,
      status: "initiated",
      metadata: {
        expiresAt: paymentResponse.expiresAt,
      },
    });

    res.json({
      pidx: paymentResponse.pidx,
      paymentUrl: paymentResponse.paymentUrl,
      expiresAt: paymentResponse.expiresAt,
      amount: amountNPR,
      currency: "NPR",
    });
  } catch (e) {
    console.error("Khalti initiate error:", e);
    next(e);
  }
};

//* Verify Khalti payment after callback.
export const verifyKhaltiPayment = async (req, res, next) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "pidx is required",
      });
    }

    // Find the payment record
    const khaltiPayment = await KhaltiPayment.findOne({ pidx });
    if (!khaltiPayment) {
      return res.status(HTTP.NOT_FOUND).json({
        error: "Payment record not found",
      });
    }

    // Verify with Khalti
    const verification = await khaltiService.verifyPayment(pidx);

    // Update payment record based on status
    khaltiPayment.transactionId = verification.transactionId;
    khaltiPayment.fee = verification.fee;

    if (verification.status === "Completed") {
      khaltiPayment.status = "completed";

      // Calculate subscription period
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

      khaltiPayment.periodStart = now;
      khaltiPayment.periodEnd = periodEnd;

      // Update subscription
      const subscription = await Subscription.findById(khaltiPayment.subscription);
      if (subscription) {
        subscription.plan = khaltiPayment.planId;
        subscription.status = "active";
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = periodEnd;
        subscription.cancelAtPeriodEnd = false;
        await subscription.save();
      }

      await khaltiPayment.save();

      res.json({
        success: true,
        message: "Payment verified and subscription activated",
        payment: {
          transactionId: verification.transactionId,
          amount: verification.totalAmount,
          status: "completed",
          plan: khaltiPayment.planId,
          periodStart: now,
          periodEnd,
        },
      });
    } else if (verification.status === "Pending" || verification.status === "Initiated") {
      khaltiPayment.status = "pending";
      await khaltiPayment.save();

      res.json({
        success: false,
        message: "Payment is still pending",
        status: verification.status,
      });
    } else if (verification.status === "Refunded") {
      khaltiPayment.status = "refunded";
      await khaltiPayment.save();

      res.json({
        success: false,
        message: "Payment was refunded",
        status: "refunded",
      });
    } else if (verification.status === "Expired") {
      khaltiPayment.status = "expired";
      await khaltiPayment.save();

      res.json({
        success: false,
        message: "Payment has expired",
        status: "expired",
      });
    } else if (verification.status === "User canceled") {
      khaltiPayment.status = "canceled";
      await khaltiPayment.save();

      res.json({
        success: false,
        message: "Payment was canceled by user",
        status: "canceled",
      });
    } else {
      khaltiPayment.status = "failed";
      await khaltiPayment.save();

      res.json({
        success: false,
        message: "Payment failed",
        status: "failed",
      });
    }
  } catch (e) {
    console.error("Khalti verify error:", e);
    next(e);
  }
};

//* Get Khalti payment history for user.
export const getKhaltiPaymentHistory = async (req, res, next) => {
  try {
    const payments = await KhaltiPayment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(payments);
  } catch (e) {
    next(e);
  }
};

//* Handle Khalti payment callback (from redirect).
export const handleKhaltiCallback = async (req, res, next) => {
  try {
    const { pidx, status, transaction_id, purchase_order_id } = req.query;

    if (!pidx) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "pidx is required",
      });
    }

    // Find the payment record
    const khaltiPayment = await KhaltiPayment.findOne({ pidx });
    if (!khaltiPayment) {
      return res.status(HTTP.NOT_FOUND).json({
        error: "Payment record not found",
      });
    }

    // Verify with Khalti to get accurate status
    const verification = await khaltiService.verifyPayment(pidx);

    // Update payment record
    khaltiPayment.transactionId = verification.transactionId || transaction_id;
    khaltiPayment.fee = verification.fee || 0;

    if (verification.status === "Completed") {
      khaltiPayment.status = "completed";

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      khaltiPayment.periodStart = now;
      khaltiPayment.periodEnd = periodEnd;

      // Update subscription
      const subscription = await Subscription.findById(khaltiPayment.subscription);
      if (subscription) {
        subscription.plan = khaltiPayment.planId;
        subscription.status = "active";
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = periodEnd;
        subscription.cancelAtPeriodEnd = false;
        await subscription.save();
      }
    } else if (verification.status === "User canceled") {
      khaltiPayment.status = "canceled";
    } else if (verification.status === "Expired") {
      khaltiPayment.status = "expired";
    } else if (verification.status === "Refunded") {
      khaltiPayment.status = "refunded";
    } else {
      khaltiPayment.status = verification.status?.toLowerCase() || "pending";
    }

    await khaltiPayment.save();

    res.json({
      success: verification.status === "Completed",
      status: khaltiPayment.status,
      transactionId: khaltiPayment.transactionId,
      planId: khaltiPayment.planId,
    });
  } catch (e) {
    console.error("Khalti callback error:", e);
    next(e);
  }
};

//* Get Khalti plan prices in NPR.
export const getKhaltiPrices = async (req, res, next) => {
  try {
    const prices = {
      [SUBSCRIPTION_PLANS.FREE]: {
        id: SUBSCRIPTION_PLANS.FREE,
        name: PLAN_LIMITS[SUBSCRIPTION_PLANS.FREE].name,
        priceNPR: 0,
        priceUSD: 0,
      },
      [SUBSCRIPTION_PLANS.PLUS]: {
        id: SUBSCRIPTION_PLANS.PLUS,
        name: PLAN_LIMITS[SUBSCRIPTION_PLANS.PLUS].name,
        priceNPR: khaltiService.getPlanPriceNPR(SUBSCRIPTION_PLANS.PLUS),
        priceUSD: PLAN_LIMITS[SUBSCRIPTION_PLANS.PLUS].price / 100,
      },
      [SUBSCRIPTION_PLANS.PRO]: {
        id: SUBSCRIPTION_PLANS.PRO,
        name: PLAN_LIMITS[SUBSCRIPTION_PLANS.PRO].name,
        priceNPR: khaltiService.getPlanPriceNPR(SUBSCRIPTION_PLANS.PRO),
        priceUSD: PLAN_LIMITS[SUBSCRIPTION_PLANS.PRO].price / 100,
      },
    };

    res.json(prices);
  } catch (e) {
    next(e);
  }
};
