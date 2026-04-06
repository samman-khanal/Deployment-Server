import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, XCircle, AlertCircle, Crown, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import khaltiService from "../../services/khalti.service";
import { useSubscription } from "../../context/SubscriptionContext";

type CallbackStatus = "verifying" | "success" | "failed" | "canceled" | "expired";

export default function KhaltiCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useSubscription();
  const [status, setStatus] = useState<CallbackStatus>("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [countdown, setCountdown] = useState(3);
  const hasVerified = useRef(false);

  useEffect(() => {
    // Guard: only run once even if context values change references
    if (hasVerified.current) return;
    hasVerified.current = true;

    const pidx = searchParams.get("pidx");
    let retries = 0;

    const verifyPayment = async () => {
      if (!pidx) {
        setStatus("failed");
        setMessage("Invalid payment callback. Missing payment ID.");
        return;
      }

      try {
        const result = await khaltiService.verifyPayment(pidx);

        if (result.success) {
          setStatus("success");
          setMessage("Your subscription has been activated successfully.");
          toast.success("Payment successful!");
          await refresh();

          // Countdown then redirect
          let count = 3;
          const interval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(interval);
              navigate("/subscription/success");
            }
          }, 1000);
        } else {
          if (result.status === "canceled") {
            setStatus("canceled");
            setMessage("Payment was canceled. You can try again.");
          } else if (result.status === "expired") {
            setStatus("expired");
            setMessage("Payment session has expired. Please try again.");
          } else if (result.status === "pending") {
            setMessage("Payment is still being processed. Please wait...");
            retries++;
            if (retries < 10) {
              setTimeout(verifyPayment, 3000);
            } else {
              setStatus("failed");
              setMessage("Payment verification timed out. Please contact support if amount was deducted.");
            }
          } else {
            setStatus("failed");
            setMessage(result.message || "Payment verification failed.");
          }
        }
      } catch (error: any) {
        setStatus("failed");

        let errorMessage = "Failed to verify payment.";
        if (error?.response?.status === 404) {
          errorMessage = "Payment session not found. It may have expired.";
        } else if (error?.response?.status === 401) {
          errorMessage = "Authentication error. Please log in and try again.";
        } else if (error?.response?.status >= 500) {
          errorMessage = "Server error. Please contact support if an amount was deducted.";
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Verifying state ─── */
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-60" />
            <div className="relative w-20 h-20 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying Payment</h2>
          <p className="text-slate-500 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  /* ─── Success state ─── */
  if (status === "success") {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
        {/* Decorative blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-md w-full">
          {/* Animated icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 scale-150 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-emerald-300 opacity-20 scale-125" />
              <div className="relative w-24 h-24 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Green accent bar */}
            <div className="h-1 bg-linear-to-r from-emerald-400 to-indigo-500" />

            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Payment Successful!
              </h1>
              <p className="text-slate-500 text-sm mb-6">{message}</p>

              {/* Plan badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full mb-8">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-semibold">Subscription Activated</span>
              </div>

              {/* Countdown redirect */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-slate-600 text-sm mb-3">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  <span>Redirecting in <span className="font-bold text-indigo-600">{countdown}s</span>…</span>
                </div>
                {/* Smooth progress bar */}
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${((3 - countdown) / 3) * 100}%`,
                      transition: "width 1s linear",
                    }}
                  />
                </div>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="mt-3 w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Go to Dashboard now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error / Canceled / Expired states ─── */
  const isWarning = status === "canceled" || status === "expired";
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className={`h-1 ${isWarning ? "bg-amber-400" : "bg-red-400"}`} />

          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isWarning ? "bg-amber-50" : "bg-red-50"}`}>
                {isWarning ? (
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-500" />
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {status === "canceled" ? "Payment Canceled" : status === "expired" ? "Payment Expired" : "Payment Failed"}
            </h1>
            <p className="text-slate-500 text-sm mb-8">{message}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/subscription/upgrade")}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => navigate("/subscription")}
                className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                View Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
