import { useState, useEffect } from "react";
import { X, Crown, Sparkles, Calendar, CreditCard, Loader2, Zap, MessageSquare, Users, Shield, BarChart3, Headphones, LayoutGrid, Trello, ExternalLink } from "lucide-react";
import { useSubscription } from "../../context/SubscriptionContext";
import type { Payment, KhaltiPayment } from "../../types/subscription.types";
import subscriptionService from "../../services/subscription.service";
import khaltiService from "../../services/khalti.service";
import { toast } from "sonner";

type UnifiedPayment = {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  receiptUrl?: string | null;
  source: "stripe" | "khalti";
};

interface CurrentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CurrentPlanModal({ isOpen, onClose }: CurrentPlanModalProps) {
  const {
    subscription,
    limits,
    isPro,
    isPlus,
    refresh,
    redirectToBillingPortal,
  } = useSubscription();

  const isPaid = isPro || isPlus;

  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen || !isPaid) return;

    const loadPayments = async () => {
      setIsLoadingPayments(true);
      try {
        const [stripeResult, khaltiResult] = await Promise.allSettled([
          subscriptionService.getPaymentHistory(),
          khaltiService.getPaymentHistory(),
        ]);

        const unified: UnifiedPayment[] = [];

        if (stripeResult.status === "fulfilled") {
          stripeResult.value.forEach((p: Payment) => {
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

        if (khaltiResult.status === "fulfilled") {
          khaltiResult.value.forEach((p: KhaltiPayment) => {
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
  }, [isOpen, isPro]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !subscription) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string, source: "stripe" | "khalti") => {
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

  const proFeatures = [
    { icon: Zap, label: "Unlimited Workspaces", description: "No limits on workspace creation" },
    { icon: LayoutGrid, label: "Unlimited Boards", description: "Create as many boards as you need" },
    { icon: MessageSquare, label: "Permanent Messages", description: "Message history stored forever" },
    { icon: BarChart3, label: "Advanced Analytics", description: "Deep insights into your team" },
    { icon: Headphones, label: "Priority Support", description: "Get help faster when you need it" },
    { icon: Shield, label: "Enhanced Security", description: "Advanced security features" },
  ];

  const plusFeatures = [
    { icon: Zap, label: `${limits?.maxWorkspaces} Workspaces`, description: "Create up to 15 workspaces" },
    { icon: LayoutGrid, label: `${limits?.maxBoards} Task Boards`, description: "Manage up to 15 boards" },
    { icon: Users, label: "Unlimited Members", description: "Add as many members as needed" },
    { icon: MessageSquare, label: "1-year Message History", description: "Messages retained for up to 1 year" },
  ];

  const freeFeatures = [
    { icon: Zap, label: `${limits?.maxWorkspaces} Workspaces`, description: "Create up to 5 workspaces" },
    { icon: LayoutGrid, label: `${limits?.maxBoards} Task Boards`, description: "Manage up to 5 boards" },
    { icon: Users, label: "Unlimited Members", description: "Add as many members as needed" },
    { icon: MessageSquare, label: "30-day Message History", description: "Messages kept for 30 days" },
  ];

  const activeFeatures = isPro ? proFeatures : isPlus ? plusFeatures : freeFeatures;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
      />

      {/* Modal - Centered */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-8 py-6 bg-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-white/15">
                  {isPro ? (
                    <Crown className="w-7 h-7 text-white" />
                  ) : (
                    <Sparkles className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {limits?.name} Plan
                  </h2>
                  <p className="text-sm font-semibold text-indigo-100">
                    {isPro ? "Full access to all features" : isPlus ? "More power for your team" : "Great for getting started"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Display */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {isPaid ? `$${((limits?.price || 0) / 100).toFixed(2)}` : "Free"}
              </span>
              <span className="text-xs font-medium text-indigo-200">
                {isPaid ? "/month" : "Forever"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="relative overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 280px)' }}>
            {/* Status */}
            <div className="mb-6">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  subscription.status === "active"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : subscription.status === "canceled"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  subscription.status === "active" ? "bg-green-500" :
                  subscription.status === "canceled" ? "bg-red-500" : "bg-amber-500"
                }`} />
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                {subscription.cancelAtPeriodEnd && " (Canceling)"}
              </div>
            </div>

            {/* Billing Cycle for paid plans */}
            {isPaid && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Billing Cycle</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500">Current Period Start</div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {formatDate(subscription.currentPeriodStart)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      {subscription.cancelAtPeriodEnd ? "Access Until" : "Next Billing Date"}
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {formatDate(subscription.currentPeriodEnd)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Limits */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                Plan Resources
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="group bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <LayoutGrid className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {limits?.maxWorkspaces === "Unlimited" ? "∞" : limits?.maxWorkspaces}
                  </div>
                  <div className="text-xs font-medium text-slate-600">Workspaces</div>
                </div>
                <div className="group bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Trello className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {limits?.maxBoards === "Unlimited" ? "∞" : limits?.maxBoards}
                  </div>
                  <div className="text-xs font-medium text-slate-600">Task Boards</div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                {isPro ? "Pro Features" : isPlus ? "Plus Features" : "Included Features"}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {activeFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                      <feature.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{feature.label}</div>
                      <div className="text-sm text-slate-500">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment History */}
            {isPaid && (
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  <CreditCard className="w-4 h-4" />
                  Payment History
                  {isLoadingPayments && <Loader2 className="w-3 h-3 animate-spin" />}
                </h3>

                {!isLoadingPayments && payments.length > 0 && (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div
                        key={payment._id}
                        className="flex items-center justify-between bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {formatAmount(payment.amount, payment.currency, payment.source)}
                          </div>
                          <div className="text-sm text-slate-500">
                            {formatDate(payment.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                              payment.status === "succeeded" || payment.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : payment.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {payment.status}
                          </span>
                          <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${payment.source === "khalti" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {payment.source === "khalti" ? "Khalti" : "Stripe"}
                          </span>
                          {payment.receiptUrl && (
                            <a
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                            >
                              Receipt <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingPayments && payments.length === 0 && (
                  <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-4 text-center">
                    No payment history yet.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="relative p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex flex-wrap gap-3 justify-end">
              {isPaid ? (
                <>
                  {subscription.stripeCustomerId && (
                    <button
                      onClick={handleBillingPortal}
                      disabled={isLoadingPortal}
                      className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-all duration-300 hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoadingPortal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Manage Billing
                    </button>
                  )}
                  {subscription.cancelAtPeriodEnd ? (
                    <button
                      onClick={handleResume}
                      disabled={isResuming}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                      {isResuming && <Loader2 className="w-4 h-4 animate-spin" />}
                      Resume Subscription
                    </button>
                  ) : showCancelConfirm ? (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-red-800 mb-1">Are you sure?</p>
                        <p className="text-xs text-red-600">
                          You'll keep access until {formatDate(subscription.currentPeriodEnd)}.
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
                        >
                          Keep Subscription
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isCanceling}
                          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                          {isCanceling && <Loader2 className="w-4 h-4 animate-spin" />}
                          Yes, Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-6 py-2.5 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-400 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = "/subscription/upgrade";
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-xl flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
