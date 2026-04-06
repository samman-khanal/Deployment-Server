import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Crown, Sparkles, Loader2, PartyPopper, ArrowRight, Share2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useSubscription } from "../../context/SubscriptionContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function SubscriptionSuccessPage() {
  useDocumentTitle("Subscription Activated");
  const navigate = useNavigate();
  const { refresh, isLoading, isPro, isPlus, limits } = useSubscription();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    const refreshSubscription = async () => {
      // Add a small delay to allow webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await refresh();
      setIsRefreshing(false);
    };

    refreshSubscription();
  }, [refresh]);

  // Stripe may pass a session_id, but we don't need it here.

  const planName = limits?.name || (isPro ? "Pro" : isPlus ? "Plus" : "");

  const proFeatures = [
    "Unlimited workspaces",
    "Unlimited task boards",
    "Permanent message history",
    "Priority support",
    "Advanced analytics",
    "Custom integrations",
  ];

  const plusFeatures = [
    "Up to 15 workspaces",
    "Up to 15 task boards",
    "1-year message history",
    "Standard support",
  ];

  const features = useMemo(() => {
    if (limits) {
      return [
        `${limits.maxWorkspaces === "Unlimited" ? "Unlimited" : `Up to ${limits.maxWorkspaces}`} workspaces`,
        `${limits.maxBoards === "Unlimited" ? "Unlimited" : `Up to ${limits.maxBoards}`} task boards`,
        `${limits.messageRetention || "Extended"} message history`,
        isPro ? "Priority support" : "Standard support",
        ...(isPro ? ["Advanced analytics", "Custom integrations"] : []),
      ];
    }
    return isPro ? proFeatures : plusFeatures;
  }, [limits, isPro]);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"][i % 5],
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      })),
    [],
  );

  if (isLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-md animate-bounce">
              <PartyPopper className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome to {planName}!
            </h1>
            <p className="text-base text-slate-600 mb-6">
              Your subscription has been activated successfully.
            </p>

            {/* Plan Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full mb-8">
              {isPro ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span className="text-sm font-semibold">{planName} Member</span>
            </div>

            {/* What's Unlocked */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-slate-900 mb-4 text-sm">
                You now have access to:
              </h3>
              <ul className="space-y-3">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                fullWidth
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate("/subscription")}
              >
                View Subscription Details
              </Button>
              <button
                onClick={() => {
                  const text = `Just upgraded to ${planName} on CollabSpace! 🚀 Unlocking unlimited collaboration for my team. #CollabSpace #Productivity`;
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share on X (Twitter)
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
            <p className="text-sm text-slate-500 text-center">
              Need help?{" "}
              <Link
                to="/contact"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        {/* Confetti Effect (CSS-only) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {confettiPieces.map((piece, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={piece}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
