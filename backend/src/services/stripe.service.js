//? Stripe payment service for handling payment operations.
import Stripe from "stripe";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS } from "../constants/subscriptionPlans.constant.js";

//* Initialize Stripe with secret key from environment variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//* Create a Stripe customer for a user.
export const createCustomer = async ({ email, name, userId }) => {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });
  return customer;
};

//* Retrieve a Stripe customer by ID.
export const getCustomer = async (customerId) => {
  return stripe.customers.retrieve(customerId);
};

//* Create a checkout session for subscription.
export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  userId,
}) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });
  return session;
};

//* Create a billing portal session for managing subscription.
export const createBillingPortalSession = async ({ customerId, returnUrl }) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
};

//* Retrieve a subscription from Stripe.
export const getSubscription = async (subscriptionId) => {
  return stripe.subscriptions.retrieve(subscriptionId);
};

//* Cancel a subscription at period end.
export const cancelSubscription = async (subscriptionId) => {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
};

//* Resume a subscription that was set to cancel.
export const resumeSubscription = async (subscriptionId) => {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
};

//* Verify webhook signature and construct event.
export const constructWebhookEvent = (payload, signature, webhookSecret) => {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};

//* Create a price for the Pro plan (one-time setup).
export const createProPlanPrice = async () => {
  // First, create a product
  const product = await stripe.products.create({
    name: PLAN_LIMITS[SUBSCRIPTION_PLANS.PRO].name,
    description: PLAN_LIMITS[SUBSCRIPTION_PLANS.PRO].description,
  });

  // Then, create a price for the product
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: PLAN_LIMITS[SUBSCRIPTION_PLANS.PRO].price,
    currency: "usd",
    recurring: {
      interval: "month",
    },
  });

  return { product, price };
};

//* Retrieve all prices for a product.
export const getPrices = async () => {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });
  return prices.data;
};

//* Retrieve payment intent details.
export const getPaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

//* List invoices for a customer.
export const listInvoices = async (customerId) => {
  return stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });
};

export default {
  createCustomer,
  getCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  getSubscription,
  cancelSubscription,
  resumeSubscription,
  constructWebhookEvent,
  createProPlanPrice,
  getPrices,
  getPaymentIntent,
  listInvoices,
};
