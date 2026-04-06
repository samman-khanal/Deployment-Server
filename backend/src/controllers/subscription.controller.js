//? Subscription controller for handling subscription-related requests.
import * as subscriptionService from "../services/subscription.service.js";
import * as stripeService from "../services/stripe.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Get current user's subscription.
export const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user._id);
    const limits = await subscriptionService.getUserPlanLimits(req.user._id);
    res.json({ subscription, limits });
  } catch (e) {
    next(e);
  }
};

//* Get available subscription plans.
export const getPlans = async (req, res, next) => {
  try {
    const plans = subscriptionService.getPlansInfo();
    res.json(plans);
  } catch (e) {
    next(e);
  }
};

//* Create checkout session for upgrading to Pro.
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { planId, successUrl, cancelUrl } = req.body;

    if (!planId || !successUrl || !cancelUrl) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "planId, successUrl and cancelUrl are required",
      });
    }

    const session = await subscriptionService.createUpgradeCheckoutSession(
      req.user._id,
      { planId, successUrl, cancelUrl }
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (e) {
    next(e);
  }
};

//* Create billing portal session.
export const createBillingPortal = async (req, res, next) => {
  try {
    const { returnUrl } = req.body;

    if (!returnUrl) {
      return res.status(HTTP.BAD_REQUEST).json({
        error: "returnUrl is required",
      });
    }

    const session = await subscriptionService.createBillingPortalSession(
      req.user._id,
      returnUrl
    );

    res.json({ url: session.url });
  } catch (e) {
    next(e);
  }
};

//* Cancel subscription.
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(req.user._id);
    res.json({
      message: "Subscription will be canceled at the end of the billing period",
      subscription,
    });
  } catch (e) {
    next(e);
  }
};

//* Resume subscription.
export const resumeSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.resumeSubscription(req.user._id);
    res.json({
      message: "Subscription resumed successfully",
      subscription,
    });
  } catch (e) {
    next(e);
  }
};

//* Get payment history.
export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await subscriptionService.getPaymentHistory(req.user._id);
    res.json(payments);
  } catch (e) {
    next(e);
  }
};

//* Check workspace creation eligibility.
export const checkWorkspaceLimit = async (req, res, next) => {
  try {
    const result = await subscriptionService.canCreateWorkspace(req.user._id);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

//* Check board creation eligibility.
export const checkBoardLimit = async (req, res, next) => {
  try {
    const result = await subscriptionService.canCreateBoard(req.user._id);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

//* Stripe webhook handler.
export const handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeService.constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(HTTP.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await subscriptionService.handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await subscriptionService.handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await subscriptionService.handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        console.log("Payment failed for invoice:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (e) {
    console.error("Error handling webhook:", e);
    next(e);
  }
};
