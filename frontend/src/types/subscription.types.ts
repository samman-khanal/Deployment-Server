// Subscription types and interfaces

export type SubscriptionPlan = "free" | "plus" | "pro";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

export interface PlanLimits {
  maxWorkspaces: number | "Unlimited";
  maxBoards: number | "Unlimited";
  messageRetention: string;
  price: number;
  name: string;
  description: string;
}

export interface Subscription {
  _id: string;
  user: string;
  plan: SubscriptionPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionWithLimits {
  subscription: Subscription;
  limits: PlanLimits;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  maxWorkspaces: number | "Unlimited";
  maxBoards: number | "Unlimited";
  messageRetention: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface BillingPortalSession {
  url: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  upgradeRequired?: boolean;
}

export interface Payment {
  _id: string;
  user: string;
  subscription: string;
  stripePaymentIntentId: string;
  stripeInvoiceId: string | null;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paymentMethod: string | null;
  receiptUrl: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Khalti Payment Types
export interface KhaltiPaymentInitResponse {
  pidx: string;
  paymentUrl: string;
  expiresAt: string;
  amount: number;
  currency: string;
}

export interface KhaltiPaymentVerifyResponse {
  success: boolean;
  message: string;
  status: string;
  payment?: {
    transactionId: string;
    amount: number;
    status: string;
    plan: SubscriptionPlan;
    periodStart: string;
    periodEnd: string;
  };
}

export interface KhaltiPayment {
  _id: string;
  user: string;
  subscription: string;
  pidx: string;
  transactionId: string | null;
  purchaseOrderId: string;
  planId: SubscriptionPlan;
  amount: number;
  currency: string;
  status: "initiated" | "pending" | "completed" | "failed" | "refunded" | "expired" | "canceled";
  fee: number;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KhaltiPrices {
  [key: string]: {
    id: SubscriptionPlan;
    name: string;
    priceNPR: number;
    priceUSD: number;
  };
}

// Feature list for plan comparison
export interface PlanFeature {
  name: string;
  free: boolean | string;
  plus: boolean | string;
  pro: boolean | string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name: "Workspaces", free: "5", plus: "15", pro: "Unlimited" },
  { name: "Task Boards", free: "5", plus: "15", pro: "Unlimited" },
  { name: "Team Members", free: "Unlimited", plus: "Unlimited", pro: "Unlimited" },
  { name: "Channels & DMs", free: true, plus: true, pro: true },
  { name: "File Sharing", free: true, plus: true, pro: true },
  { name: "Message History", free: "30 days", plus: "Forever", pro: "Forever" },
  { name: "Video Calls", free: true, plus: true, pro: true },
  { name: "Priority Support", free: false, plus: false, pro: true },
  { name: "Advanced Analytics", free: false, plus: false, pro: true },
  { name: "Custom Integrations", free: false, plus: false, pro: true },
];
