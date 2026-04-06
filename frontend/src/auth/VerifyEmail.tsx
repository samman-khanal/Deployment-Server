import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Mail, ArrowRight, RotateCcw, Shield } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../components/ui/Button";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailFromQuery = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start resend cooldown on mount
  useEffect(() => {
    startCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleDigitChange = (index: number, value: string) => {
    setError("");
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        focusInput(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newDigits = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      newDigits[i] = ch;
    });
    setDigits(newDigits);
    const nextEmpty = Math.min(pasted.length, OTP_LENGTH - 1);
    focusInput(nextEmpty);
  };

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH && digits.every((d) => d !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setError("Please enter all 6 digits.");
      return;
    }
    if (!emailFromQuery) {
      setError("Email address is missing. Please register again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.post('/auth/verify-otp', {
        email: emailFromQuery,
        otp,
      });

      toast.success("Email verified! Please sign in.");
      navigate("/login", { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Verification failed. Please try again.";
      setError(message);
      // Clear digits on wrong OTP
      setDigits(Array(OTP_LENGTH).fill(""));
      focusInput(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailFromQuery || cooldown > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      await api.post('/auth/resend-otp', { email: emailFromQuery });
      toast.success("A new verification code has been sent.");
      setDigits(Array(OTP_LENGTH).fill(""));
      focusInput(0);
      startCooldown();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to resend code. Please try again.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = emailFromQuery
    ? emailFromQuery.replace(/(.{2}).+(@.+)/, "$1***$2")
    : "your email";

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a 6-digit verification code to ${maskedEmail}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email indicator */}
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Code sent to</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {emailFromQuery || "—"}
            </p>
          </div>
        </div>

        {/* OTP input boxes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
            Enter verification code
          </label>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                disabled={isSubmitting}
                autoFocus={i === 0}
                aria-label={`Digit ${i + 1}`}
                className={`
                  w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold
                  border-2 rounded-xl outline-none transition-all duration-150
                  ${error
                    ? "border-red-400 bg-red-50 text-red-700"
                    : digit
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 bg-white text-slate-800 focus:border-indigo-500 focus:bg-indigo-50"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>

          {error && (
            <p className="mt-2 text-center text-sm text-red-600 font-medium">{error}</p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!isComplete || isSubmitting}
          loading={isSubmitting}
        >
          Verify email
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Resend section */}
        <div className="text-center space-y-1">
          <p className="text-sm sm:text-base text-slate-500">Didn't receive the code?</p>
          {cooldown > 0 ? (
            <p className="text-sm sm:text-base text-slate-400">
              Resend available in{" "}
              <span className="font-semibold text-slate-600">{cooldown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center text-sm sm:text-base text-slate-600">
          Wrong account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Back to sign in
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Shield className="w-4 h-4 text-slate-400" />
          <p className="text-xs text-slate-500">
            Your data is encrypted and secure
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

