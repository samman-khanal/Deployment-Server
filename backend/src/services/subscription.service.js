//? Subscription service for managing user subscriptions.
import Subscription from "../models/Subscription.model.js";
import Payment from "../models/Payment.model.js";
import Workspace from "../models/Workspace.model.js";
import Board from "../models/Board.model.js";
import User from "../models/User.model.js";
import * as stripeService from "./stripe.service.js";
import {
  SUBSCRIPTION_PLANS,
  PLAN_LIMITS,
} from "../constants/subscriptionPlans.constant.js";

//* Create a free subscription for a new user.
export const createFreeSubscription = async (userId) => {
  const subscription = await Subscription.create({
    user: userId,
    plan: SUBSCRIPTION_PLANS.FREE,
    status: "active",
  });
  return subscription;
};

//* Get user's subscription.
export const getUserSubscription = async (userId) => {
  let subscription = await Subscription.findOne({ user: userId });

  // If no subscription exists, create a free one
  if (!subscription) {
    subscription = await createFreeSubscription(userId);
  }

  return subscription;
};

//* Get user's plan limits.
export const getUserPlanLimits = async (userId) => {
  const subscription = await getUserSubscription(userId);
  return PLAN_LIMITS[subscription.plan];
};

//* Check if user can create more workspaces.
export const canCreateWorkspace = async (userId) => {
  const subscription = await getUserSubscription(userId);
  const limits = PLAN_LIMITS[subscription.plan];

  if (limits.maxWorkspaces === Infinity) {
    return { allowed: true };
  }

  const workspaceCount = await Workspace.countDocuments({ owner: userId });

  if (workspaceCount >= limits.maxWorkspaces) {
    return {
      allowed: false,
      reason: `You have reached the maximum number of workspaces (${limits.maxWorkspaces}) for the ${limits.name} plan. Please upgrade to Pro for unlimited workspaces.`,
      currentCount: workspaceCount,
      limit: limits.maxWorkspaces,
    };
  }

  return { allowed: true, currentCount: workspaceCount, limit: limits.maxWorkspaces };
};

//* Check if user can create more boards.
export const canCreateBoard = async (userId) => {
  const subscription = await getUserSubscription(userId);
  const limits = PLAN_LIMITS[subscription.plan];

  if (limits.maxBoards === Infinity) {
    return { allowed: true };
  }

  const boardCount = await Board.countDocuments({ createdBy: userId });

  if (boardCount >= limits.maxBoards) {
    return {
      allowed: false,
      reason: `You have reached the maximum number of boards (${limits.maxBoards}) for the ${limits.name} plan. Please upgrade to Pro for unlimited boards.`,
      currentCount: boardCount,
      limit: limits.maxBoards,
    };
  }

  return { allowed: true, currentCount: boardCount, limit: limits.maxBoards };
};

//* Create checkout session for upgrading to a paid plan.
export const createUpgradeCheckoutSession = async (
  userId,
  { planId, successUrl, cancelUrl }
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!planId || planId === SUBSCRIPTION_PLANS.FREE) {
    throw new Error("Invalid plan selected");
  }

  if (planId !== SUBSCRIPTION_PLANS.PLUS && planId !== SUBSCRIPTION_PLANS.PRO) {
    throw new Error("Unsupported plan selected");
  }

  let subscription = await getUserSubscription(userId);

  // Create Stripe customer if not exists
  if (!subscription.stripeCustomerId) {
    const customer = await stripeService.createCustomer({
      email: user.email,
      name: user.fullName,
      userId: userId.toString(),
    });
    subscription.stripeCustomerId = customer.id;
    await subscription.save();
  }

  const priceId =
    planId === SUBSCRIPTION_PLANS.PRO
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_PLUS_PRICE_ID;

  if (!priceId) {
    throw new Error(
      planId === SUBSCRIPTION_PLANS.PRO
        ? "Stripe Pro price ID not configured"
        : "Stripe Plus price ID not configured"
    );
  }

  const session = await stripeService.createCheckoutSession({
    customerId: subscription.stripeCustomerId,
    priceId,
    successUrl,
    cancelUrl,
    userId: userId.toString(),
  });

  return session;
};

//* Create billing portal session.
export const createBillingPortalSession = async (userId, returnUrl) => {
  const subscription = await getUserSubscription(userId);

  if (!subscription.stripeCustomerId) {
    throw new Error("No billing information found");
  }

  const session = await stripeService.createBillingPortalSession({
    customerId: subscription.stripeCustomerId,
    returnUrl,
  });

  return session;
};

//* Handle successful subscription update from Stripe webhook.
export const handleSubscriptionUpdated = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({
    stripeCustomerId: stripeSubscription.customer,
  });

  if (!subscription) {
    console.error("No subscription found for customer:", stripeSubscription.customer);
    return;
  }

  subscription.stripeSubscriptionId = stripeSubscription.id;
  subscription.status = stripeSubscription.status;
  subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
  subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

  if (stripeSubscription.status === "active" || stripeSubscription.status === "trialing") {
    const plusPriceId = process.env.STRIPE_PLUS_PRICE_ID;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

    const priceId = stripeSubscription?.items?.data?.[0]?.price?.id;

    if (priceId && proPriceId && priceId === proPriceId) {
      subscription.plan = SUBSCRIPTION_PLANS.PRO;
    } else if (priceId && plusPriceId && priceId === plusPriceId) {
      subscription.plan = SUBSCRIPTION_PLANS.PLUS;
    } else {
      // If we can't resolve plan from price id, keep current plan.
      // This avoids accidentally upgrading everyone to Pro.
    }
  }

  await subscription.save();
  return subscription;
};

//* Handle subscription deleted/canceled from Stripe webhook.
export const handleSubscriptionDeleted = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (!subscription) {
    console.error("No subscription found for:", stripeSubscription.id);
    return;
  }

  // Downgrade to free plan
  subscription.plan = SUBSCRIPTION_PLANS.FREE;
  subscription.status = "canceled";
  subscription.stripeSubscriptionId = null;
  subscription.currentPeriodStart = null;
  subscription.currentPeriodEnd = null;
  subscription.cancelAtPeriodEnd = false;

  await subscription.save();
  return subscription;
};

//* Handle successful payment from Stripe webhook.
export const handlePaymentSucceeded = async (invoice) => {
  const subscription = await Subscription.findOne({
    stripeCustomerId: invoice.customer,
  });

  if (!subscription) {
    console.error("No subscription found for customer:", invoice.customer);
    return;
  }

  await Payment.create({
    user: subscription.user,
    subscription: subscription._id,
    stripePaymentIntentId: invoice.payment_intent,
    stripeInvoiceId: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    receiptUrl: invoice.hosted_invoice_url,
    description: `Pro Plan - ${new Date(invoice.period_start * 1000).toLocaleDateString()} to ${new Date(invoice.period_end * 1000).toLocaleDateString()}`,
  });
};

//* Cancel subscription.
export const cancelSubscription = async (userId) => {
  const subscription = await getUserSubscription(userId);

  if (subscription.plan === "free" || subscription.status !== "active") {
    throw new Error("No active subscription to cancel");
  }

  // If paid via Stripe, cancel through Stripe; Khalti is one-time so just mark locally
  if (subscription.stripeSubscriptionId) {
    await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
  }

  subscription.cancelAtPeriodEnd = true;
  await subscription.save();

  return subscription;
};

//* Resume subscription.
export const resumeSubscription = async (userId) => {
  const subscription = await getUserSubscription(userId);

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error("No subscription to resume");
  }

  // Only call Stripe if this is a Stripe-managed subscription
  if (subscription.stripeSubscriptionId) {
    await stripeService.resumeSubscription(subscription.stripeSubscriptionId);
  }

  subscription.cancelAtPeriodEnd = false;
  await subscription.save();

  return subscription;
};

//* Get user's payment history.
export const getPaymentHistory = async (userId) => {
  return Payment.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20);
};

//* Get subscription plans info.
export const getPlansInfo = () => {
  return Object.entries(PLAN_LIMITS).map(([key, value]) => ({
    id: key,
    ...value,
    maxWorkspaces: value.maxWorkspaces === Infinity ? "Unlimited" : value.maxWorkspaces,
    maxBoards: value.maxBoards === Infinity ? "Unlimited" : value.maxBoards,
    messageRetention: value.messageRetentionDays === Infinity ? "Forever" : `${value.messageRetentionDays} days`,
  }));
};
