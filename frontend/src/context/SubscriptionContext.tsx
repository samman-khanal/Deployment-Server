import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import subscriptionService from "../services/subscription.service";
import khaltiService from "../services/khalti.service";
import type {
  Subscription,
  PlanLimits,
  PlanInfo,
  LimitCheckResult,
  SubscriptionPlan,
  KhaltiPrices,
} from "../types/subscription.types";
import { useAuth } from "../hooks/useAuth";

interface SubscriptionContextType {
  subscription: Subscription | null;
  limits: PlanLimits | null;
  plans: PlanInfo[];
  khaltiPrices: KhaltiPrices | null;
  isLoading: boolean;
  error: string | null;
  isPro: boolean;
  isPlus: boolean;
  isFree: boolean;
  refresh: () => Promise<void>;
  checkWorkspaceLimit: () => Promise<LimitCheckResult>;
  checkBoardLimit: () => Promise<LimitCheckResult>;
  redirectToCheckout: (planId: Exclude<SubscriptionPlan, "free">) => Promise<void>;
  redirectToKhaltiCheckout: (planId: Exclude<SubscriptionPlan, "free">) => Promise<void>;
  redirectToBillingPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [khaltiPrices, setKhaltiPrices] = useState<KhaltiPrices | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";
  const isPlus = subscription?.plan === "plus" && subscription?.status === "active";
  const isFree = !isPro && !isPlus;

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const [subData, plansData, khaltiPricesData] = await Promise.all([
        subscriptionService.getMySubscription(),
        subscriptionService.getPlans(),
        khaltiService.getPrices().catch(() => null), // Khalti prices are optional
      ]);

      setSubscription(subData.subscription);
      setLimits(subData.limits);
      setPlans(plansData);
      if (khaltiPricesData) {
        setKhaltiPrices(khaltiPricesData);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load subscription";
      setError(message);
      console.error("Subscription fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refresh = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  const checkWorkspaceLimit = useCallback(async (): Promise<LimitCheckResult> => {
    try {
      return await subscriptionService.checkWorkspaceLimit();
    } catch {
      return { allowed: true };
    }
  }, []);

  const checkBoardLimit = useCallback(async (): Promise<LimitCheckResult> => {
    try {
      return await subscriptionService.checkBoardLimit();
    } catch {
      return { allowed: true };
    }
  }, []);

  const redirectToCheckout = useCallback(
    async (planId: Exclude<SubscriptionPlan, "free">) => {
    try {
      const successUrl = `${window.location.origin}/subscription/success`;
      const cancelUrl = `${window.location.origin}/subscription/upgrade`;

      const session = await subscriptionService.createCheckoutSession(
        planId,
        successUrl,
        cancelUrl
      );

      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to start checkout";
      throw new Error(message);
    }
    },
    []
  );

  const redirectToKhaltiCheckout = useCallback(
    async (planId: Exclude<SubscriptionPlan, "free">) => {
      try {
        const returnUrl = `${window.location.origin}/subscription/khalti-callback`;
        const websiteUrl = window.location.origin;

        const response = await khaltiService.initiatePayment(
          planId,
          returnUrl,
          websiteUrl
        );

        // Redirect to Khalti payment page
        window.location.href = response.paymentUrl;
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || "Failed to start Khalti checkout";
        throw new Error(message);
      }
    },
    []
  );

  const redirectToBillingPortal = useCallback(async () => {
    try {
      const returnUrl = `${window.location.origin}/subscription`;

      const session = await subscriptionService.createBillingPortalSession(returnUrl);

      // Redirect to Stripe Billing Portal
      window.location.href = session.url;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to open billing portal";
      throw new Error(message);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        limits,
        plans,
        khaltiPrices,
        isLoading,
        error,
        isPro,
        isPlus,
        isFree,
        refresh,
        checkWorkspaceLimit,
        checkBoardLimit,
        redirectToCheckout,
        redirectToKhaltiCheckout,
        redirectToBillingPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
