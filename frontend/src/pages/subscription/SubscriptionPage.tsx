import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Crown,
  Sparkles,
  CreditCard,
  Receipt,
  AlertCircle,
  Check,
  Loader2,
  ExternalLink,
  MessageSquare,
  Trello,
  Zap,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { CurrentPlanModal } from "../../components/ui/CurrentPlanModal";
import { useSubscription } from "../../context/SubscriptionContext";
import subscriptionService from "../../services/subscription.service";
import khaltiService from "../../services/khalti.service";
import type { Payment, KhaltiPayment } from "../../types/subscription.types";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

type UnifiedPayment = {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  receiptUrl?: string | null;
  source: "stripe" | "khalti";
};

export default function SubscriptionPage() {
  useDocumentTitle("Subscription");
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };
  const {
    subscription,
    limits,
    isPro,
    isPlus,
    isLoading,
    refresh,
    redirectToBillingPortal,
  } = useSubscription();

  const isPaid = isPro || isPlus;

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const loadPayments = async () => {
      setIsLoadingPayments(true);
      try {
        const [stripePayments, khaltiPayments] = await Promise.allSettled([
          subscriptionService.getPaymentHistory(),
          khaltiService.getPaymentHistory(),
        ]);

        const unified: UnifiedPayment[] = [];

        if (stripePayments.status === "fulfilled") {
          stripePayments.value.forEach((p: Payment) => {
            unified.push({
              _id: p._id,
              amount: p.amount,
              currency: p.currency,
              status: p.status,
              createdAt: p.createdAt,
              receiptUrl: p.receiptUrl,
              source: "stripe",
            });
          });
        }

        if (khaltiPayments.status === "fulfilled") {
          khaltiPayments.value.forEach((p: KhaltiPayment) => {
            unified.push({
              _id: p._id,
              amount: p.amount,
              currency: p.currency,
              status: p.status,
              createdAt: p.createdAt,
              receiptUrl: null,
              source: "khalti",
            });
          });
        }

        unified.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPayments(unified);
      } catch {
        toast.error("Failed to load payment history");
      } finally {
        setIsLoadingPayments(false);
      }
    };

    loadPayments();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string, source: "stripe" | "khalti") => {
    // Stripe stores amounts in cents → divide by 100
    // Khalti stores amounts in NPR directly → no division
    const value = source === "khalti" ? amount : amount / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(value);
  };

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      await subscriptionService.cancelSubscription();
      toast.success("Subscription will be canceled at the end of the billing period");
      setShowCancelConfirm(false);
      await refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel subscription");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await subscriptionService.resumeSubscription();
      toast.success("Subscription resumed successfully");
      await refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resume subscription");
    } finally {
      setIsResuming(false);
    }
  };

  const handleBillingPortal = async () => {
    setIsLoadingPortal(true);
    try {
      await redirectToBillingPortal();
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
      setIsLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Loading subscription...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <div className="flex gap-0.5">
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <Trello className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <span className="text-lg font-semibold text-slate-900">CollabSpace</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Your Subscription
            </h1>
            <p className="text-slate-600 text-sm">
              Manage your plan and billing details
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Plan Card */}
          <div className="lg:col-span-2">
            <div
              className={`
                bg-white rounded-xl border overflow-hidden
                ${isPaid ? "border-indigo-200 shadow-sm" : "border-slate-200"}
              `}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        isPaid
                          ? "bg-indigo-50 border-indigo-100"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      {isPro ? (
                        <Crown className="w-6 h-6 text-indigo-600" />
                      ) : isPlus ? (
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                      ) : (
                        <Sparkles className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900">
                          {limits?.name} Plan
                        </h2>
                        {subscription?.cancelAtPeriodEnd && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 rounded-full">
                            Canceling
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-0.5 text-slate-500">
                        {limits?.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {isPaid ? `$${((limits?.price || 0) / 100).toFixed(2)}` : "Free"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {isPaid ? "per month" : "Forever free"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Status Badge */}
                <div className="mb-6">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      subscription?.status === "active"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        subscription?.status === "active"
                          ? "bg-green-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {subscription?.status
                      ? subscription.status.charAt(0).toUpperCase() +
                        subscription.status.slice(1)
                      : "Active"}
                  </div>
                </div>

                {/* Limits Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 transition-colors hover:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-900">
                          {limits?.maxWorkspaces === "Unlimited"
                            ? "∞"
                            : limits?.maxWorkspaces}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Workspaces</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 transition-colors hover:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                        <Trello className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-900">
                          {limits?.maxBoards === "Unlimited" ? "∞" : limits?.maxBoards}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Task Boards</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Retention Notice */}
                <div
                  className={`rounded-lg p-4 mb-6 border ${
                    isPaid
                      ? "bg-green-50/50 border-green-100"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      isPaid ? "bg-white border-green-200" : "bg-white border-slate-200"
                    }`}>
                      {isPaid ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`font-medium text-sm ${
                          isPaid ? "text-green-900" : "text-slate-900"
                        }`}
                      >
                        Message History: {limits?.messageRetention}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          isPaid ? "text-green-700" : "text-slate-500"
                        }`}
                      >
                        {isPro
                          ? "Your messages are stored permanently with unlimited access"
                          : isPlus
                          ? "Your messages are retained for up to 1 year with your Plus plan"
                          : "Upgrade to Plus or Pro to keep your messages longer"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    View Plan Details
                  </button>
                  {isPaid ? (
                    <>
                      {subscription?.stripeCustomerId && (
                        <button
                          onClick={handleBillingPortal}
                          disabled={isLoadingPortal}
                          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {isLoadingPortal ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          Manage Billing
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {subscription?.cancelAtPeriodEnd ? (
                        <button
                          onClick={handleResume}
                          disabled={isResuming}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isResuming && <Loader2 className="w-4 h-4 animate-spin" />}
                          Resume Subscription
                        </button>
                      ) : showCancelConfirm ? (
                        <div className="w-full mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 font-medium mb-1">Are you sure?</p>
                          <p className="text-xs text-red-600 mb-3">
                            You'll keep access until{" "}
                            {subscription?.currentPeriodEnd
                              ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                              : "the end of your billing period"}
                            .
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowCancelConfirm(false)}
                              className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Keep Subscription
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={isCanceling}
                              className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {isCanceling && <Loader2 className="w-4 h-4 animate-spin" />}
                              Yes, Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2"
                        >
                          Cancel Subscription
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => navigate("/subscription/upgrade")}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-500" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Plan Type</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    isPro
                      ? "bg-indigo-100 text-indigo-700"
                      : isPlus
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-700"
                  }`}>
                    {limits?.name}
                  </span>
                </div>
                {isPaid && subscription?.currentPeriodStart && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Started</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(subscription.currentPeriodStart)}
                    </span>
                  </div>
                )}
                {isPaid && subscription?.currentPeriodEnd && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">
                      {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Upgrade CTA for Free users */}
            {!isPaid && (
              <div className="bg-white border border-indigo-100 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="relative">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                    <Crown className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Unlock Pro Features</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Get unlimited workspaces, boards, and permanent message history.
                  </p>
                  <button
                    onClick={() => navigate("/subscription/upgrade")}
                    className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Payment History</h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-sm">
                {isLoadingPayments ? (
                  <div className="px-5 py-6 flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading payments...</span>
                  </div>
                ) : payments.length > 0 ? (
                  payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900">
                          {formatAmount(payment.amount, payment.currency, payment.source)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 capitalize">
                            {payment.status}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${payment.source === "khalti" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {payment.source === "khalti" ? "Khalti" : "Stripe"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {formatDate(payment.createdAt)}
                        </span>
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1"
                          >
                            Receipt
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Receipt className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">No payments yet</p>
                    <p className="text-xs text-slate-500">Your payment history will appear here once you upgrade.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Plan Details Modal */}
      <CurrentPlanModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
      />
    </div>
  );
}
