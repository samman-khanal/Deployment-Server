import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Sparkles,
  Check,
  ArrowRight,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "./Button";
import { useSubscription } from "../../context/SubscriptionContext";

interface SubscriptionCardProps {
  compact?: boolean;
}

export function SubscriptionCard({ compact = false }: SubscriptionCardProps) {
  const navigate = useNavigate();
  const { subscription, limits, isPro, isLoading } = useSubscription();
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading subscription...</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renewalDate = formatDate(subscription.currentPeriodEnd);

  if (compact) {
    return (
      <div
        className={`rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md ${
          isPro
            ? "bg-indigo-50/50 border-indigo-200"
            : "bg-white border-slate-200"
        }`}
        onClick={() => navigate("/subscription")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                isPro
                  ? "bg-white border-indigo-200"
                  : "bg-white border-slate-200"
              }`}
            >
              {isPro ? (
                <Crown className="w-5 h-5 text-indigo-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {limits?.name || "Free"} Plan
                </span>
                {isPro && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 rounded-full">
                    Pro
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">
                {isPro ? "Unlimited access" : `${limits?.maxWorkspaces} workspaces`}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 ${
          isPro
            ? "bg-indigo-50 border-b border-indigo-100"
            : "bg-slate-50 border-b border-slate-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                isPro ? "bg-white border-indigo-200" : "bg-white border-slate-200"
              }`}
            >
              {isPro ? (
                <Crown className="w-6 h-6 text-indigo-600" />
              ) : (
                <Sparkles className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-lg font-bold text-slate-900`}
                >
                  {limits?.name || "Free"} Plan
                </h3>
                {subscription.cancelAtPeriodEnd && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 rounded-full">
                    Canceling
                  </span>
                )}
              </div>
              <p className={`text-sm text-slate-500`}>
                {limits?.description}
              </p>
            </div>
          </div>
          {isPro && (
            <div className="text-right">
              <div className="text-xl font-bold text-slate-900">
                ${((limits?.price || 0) / 100).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500">per month</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Limits */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-900">
              {limits?.maxWorkspaces === "Unlimited" ? "∞" : limits?.maxWorkspaces}
            </div>
            <div className="text-sm text-slate-500">Workspaces</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-900">
              {limits?.maxBoards === "Unlimited" ? "∞" : limits?.maxBoards}
            </div>
            <div className="text-sm text-slate-500">Task Boards</div>
          </div>
        </div>

        {/* Message Retention Info */}
        <div
          className={`rounded-lg p-4 mb-6 ${
            isPro
              ? "bg-green-50 border border-green-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {isPro ? (
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <div
                className={`text-sm font-medium ${
                  isPro ? "text-green-900" : "text-amber-900"
                }`}
              >
                Message History: {limits?.messageRetention}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  isPro ? "text-green-700" : "text-amber-700"
                }`}
              >
                {isPro
                  ? "Your messages are stored permanently"
                  : "Messages older than 30 days are automatically deleted"}
              </div>
            </div>
          </div>
        </div>

        {/* Renewal Date */}
        {isPro && renewalDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <Calendar className="w-4 h-4" />
            <span>
              {subscription.cancelAtPeriodEnd
                ? `Access until ${renewalDate}`
                : `Next billing date: ${renewalDate}`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1"
          >
            {showDetails ? "Hide Details" : "View Details"}
          </Button>
          {isPro ? (
            <Button
              variant="outline"
              onClick={() => navigate("/subscription")}
              className="flex-1"
            >
              Manage Subscription
            </Button>
          ) : (
            <Button
              onClick={() =>
                navigate("/subscription/upgrade", {
                  state: { from: "dashboard" },
                })
              }
              className="flex-1 gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Button>
          )}
        </div>

        {/* Details Dropdown */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              Plan Features
            </h4>
            <div className="space-y-2">
              {[
                `${limits?.maxWorkspaces === "Unlimited" ? "Unlimited" : limits?.maxWorkspaces} workspaces`,
                `${limits?.maxBoards === "Unlimited" ? "Unlimited" : limits?.maxBoards} task boards`,
                "Unlimited team members",
                "Channels & direct messages",
                "File sharing",
                `${limits?.messageRetention} message history`,
                "Video calls",
                ...(isPro
                  ? ["Priority support", "Advanced analytics", "Custom integrations"]
                  : []),
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
