import { api } from "../api/axios";
import type {
  SubscriptionWithLimits,
  PlanInfo,
  CheckoutSession,
  BillingPortalSession,
  LimitCheckResult,
  Payment,
  Subscription,
  SubscriptionPlan,
} from "../types/subscription.types";

const subscriptionService = {
  /**
   * Get current user's subscription with limits
   */
  async getMySubscription(): Promise<SubscriptionWithLimits> {
    const { data } = await api.get<SubscriptionWithLimits>("/subscriptions/me");
    return data;
  },

  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<PlanInfo[]> {
    const { data } = await api.get<PlanInfo[]>("/subscriptions/plans");
    return data;
  },

  /**
   * Create checkout session for upgrading to a paid plan
   */
  async createCheckoutSession(
    planId: Exclude<SubscriptionPlan, "free">,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> {
    const { data } = await api.post<CheckoutSession>("/subscriptions/checkout", {
      planId,
      successUrl,
      cancelUrl,
    });
    return data;
  },

  /**
   * Create billing portal session for managing subscription
   */
  async createBillingPortalSession(returnUrl: string): Promise<BillingPortalSession> {
    const { data } = await api.post<BillingPortalSession>(
      "/subscriptions/billing-portal",
      { returnUrl }
    );
    return data;
  },

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(): Promise<{ message: string; subscription: Subscription }> {
    const { data } = await api.post<{ message: string; subscription: Subscription }>(
      "/subscriptions/cancel"
    );
    return data;
  },

  /**
   * Resume a canceled subscription
   */
  async resumeSubscription(): Promise<{ message: string; subscription: Subscription }> {
    const { data } = await api.post<{ message: string; subscription: Subscription }>(
      "/subscriptions/resume"
    );
    return data;
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<Payment[]> {
    const { data } = await api.get<Payment[]>("/subscriptions/payments");
    return data;
  },

  /**
   * Check if user can create more workspaces
   */
  async checkWorkspaceLimit(): Promise<LimitCheckResult> {
    const { data } = await api.get<LimitCheckResult>("/subscriptions/limits/workspace");
    return data;
  },

  /**
   * Check if user can create more boards
   */
  async checkBoardLimit(): Promise<LimitCheckResult> {
    const { data } = await api.get<LimitCheckResult>("/subscriptions/limits/board");
    return data;
  },
};

export default subscriptionService;
