//? Khalti payment service for handling payment operations in Nepal.
import crypto from "crypto";
import {
  PLAN_LIMITS,
  SUBSCRIPTION_PLANS,
} from "../constants/subscriptionPlans.constant.js";

const KHALTI_BASE_URL = process.env.KHALTI_API_URL || 
  (process.env.KHALTI_ENV === "production"
    ? "https://khalti.com/api/v2"
    : "https://a.khalti.com/api/v2");

//* Helper function to make Khalti API requests.
const khaltiRequest = async (endpoint, method = "POST", body = null) => {
  const headers = {
    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${KHALTI_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || data.error_key || data.message || "Khalti API error";
      console.error(`Khalti API Error [${response.status}]:`, errorMessage, data);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Khalti API network error:', error);
      throw new Error('Unable to connect to Khalti payment service. Please try again.');
    }
    throw error;
  }
};

//* Initiate a Khalti payment (ePayment gateway).
export const initiatePayment = async ({
  amount,
  purchaseOrderId,
  purchaseOrderName,
  returnUrl,
  websiteUrl,
  customerInfo,
}) => {
  // Khalti amount is in paisa (1 NPR = 100 paisa)
  const amountInPaisa = Math.round(amount * 100);

  const payload = {
    return_url: returnUrl,
    website_url: websiteUrl,
    amount: amountInPaisa,
    purchase_order_id: purchaseOrderId,
    purchase_order_name: purchaseOrderName,
    customer_info: {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone || "",
    },
  };

  const response = await khaltiRequest("/epayment/initiate/", "POST", payload);

  return {
    pidx: response.pidx,
    paymentUrl: response.payment_url,
    expiresAt: response.expires_at,
    expiresIn: response.expires_in,
  };
};

//* Verify/Lookup a Khalti payment status.
export const verifyPayment = async (pidx) => {
  const response = await khaltiRequest("/epayment/lookup/", "POST", { pidx });

  return {
    pidx: response.pidx,
    totalAmount: response.total_amount / 100, // Convert paisa to NPR
    status: response.status, // Completed, Pending, Initiated, Refunded, Expired, User canceled
    transactionId: response.transaction_id,
    fee: response.fee ? response.fee / 100 : 0,
    refunded: response.refunded,
  };
};

//* Get price for a plan in NPR (Nepalese Rupees).
export const getPlanPriceNPR = (planId) => {
  // Convert USD to NPR (approximate rate, you may want to use a live rate)
  const USD_TO_NPR_RATE = 133; // 1 USD ≈ 133 NPR (update as needed)

  const planLimits = PLAN_LIMITS[planId];
  if (!planLimits || planLimits.price === 0) {
    return 0;
  }

  // Price is stored in cents, convert to dollars then to NPR
  const priceInUSD = planLimits.price / 100;
  const priceInNPR = Math.round(priceInUSD * USD_TO_NPR_RATE);

  return priceInNPR;
};

//* Generate a unique order ID.
export const generateOrderId = (userId, planId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `POOKIE-${userId.toString().slice(-6)}-${planId.toUpperCase()}-${timestamp}-${random}`;
};

//* Map plan ID to duration in months (for one-time purchases).
export const getPlanDuration = (planId) => {
  // Default to 1 month for standard purchases
  return 1;
};

//* Validate webhook signature (if Khalti sends webhooks).
export const validateWebhookSignature = (payload, signature) => {
  const webhookSecret = process.env.KHALTI_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("KHALTI_WEBHOOK_SECRET not configured");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

export default {
  initiatePayment,
  verifyPayment,
  getPlanPriceNPR,
  generateOrderId,
  getPlanDuration,
  validateWebhookSignature,
};
