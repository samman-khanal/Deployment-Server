import React, { useState } from "react";
import { api } from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Mail, Lock, ArrowRight, Shield, Check, X } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { AuthLayout } from "./AuthLayout";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  {
    label: "One special character",
    test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
];

export default function Register() {
  useDocumentTitle("Register");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (fieldName: string, value: any) => {
    let error = "";

    switch (fieldName) {
      case "fullName":
        const trimmedName = value.trim();
        if (!trimmedName) {
          error = "Full name is required";
        } else if (trimmedName.length < 2) {
          error = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
          error =
            "Name can only contain letters, spaces, hyphens and apostrophes";
        } else if (!/\s/.test(trimmedName)) {
          error = "Please enter both first and last name";
        }
        break;

      case "email":
        const trimmedEmail = value.trim().toLowerCase();
        if (!trimmedEmail) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          error = "Please enter a valid email address";
        } else {
          // Check for disposable email domains
          const disposableDomains = [
            "tempmail.com",
            "throwaway.email",
            "guerrillamail.com",
            "10minutemail.com",
            "mailinator.com",
            "fakeinbox.com",
          ];
          const domain = trimmedEmail.split("@")[1];
          if (disposableDomains.includes(domain)) {
            error = "Disposable email addresses are not allowed";
          }
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else {
          const failedReq = passwordRequirements.find(
            (req) => !req.test(value),
          );
          if (failedReq) {
            error = "Password does not meet all requirements";
          }
        }
        break;

      case "confirmPassword":
        if (!value) {
          error = "Please confirm your password";
        } else if (value !== formData.password) {
          error = "Passwords do not match";
        }
        break;

      case "agreeToTerms":
        if (!value) {
          error = "You must agree to the Terms and Privacy Policy";
        }
        break;
    }

    return error;
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const error = validateField(
      fieldName,
      formData[fieldName as keyof typeof formData],
    );
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear error when user starts typing
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    }

    if (fieldName === "password" && touched.confirmPassword) {
      const confirmErr =
        value !== formData.confirmPassword ? "Passwords do not match" : "";
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate all fields
    Object.keys(formData).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof typeof formData],
      );
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    setTouched((prev) => ({
      ...prev,
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeToTerms: true,
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Send only what backend needs (never send confirmPassword)
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      await api.post('/auth/register', payload);

      toast.success("Account created! Check your email for the verification code.");

      // Redirect to verify-email page with email pre-filled
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
      }, 1500);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter((req) =>
      req.test(formData.password),
    ).length;
    if (passed === 0) return { label: "", color: "" };
    if (passed <= 2) return { label: "Weak", color: "text-red-600" };
    if (passed <= 4) return { label: "Medium", color: "text-amber-600" };
    return { label: "Strong", color: "text-green-600" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <AuthLayout
      title="Get started for free"
      subtitle="Create your CollabSpace account and start collaborating"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full name"
          type="text"
          placeholder="Jane Doe"
          icon={<User className="w-5 h-5" />}
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={() => handleBlur("fullName")}
          error={errors.fullName}
          disabled={isLoading}
          autoComplete="name"
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="w-5 h-5" />}
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          error={errors.email}
          disabled={isLoading}
          autoComplete="email"
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            icon={<Lock className="w-5 h-5" />}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onFocus={() => setShowPasswordRequirements(true)}
            onBlur={() => {
              handleBlur("password");
              setShowPasswordRequirements(false);
            }}
            error={errors.password}
            disabled={isLoading}
            autoComplete="new-password"
            showPasswordToggle
          />

          {showPasswordRequirements && formData.password && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-700">
                  Password strength:
                </p>
                {passwordStrength.label && (
                  <span
                    className={`text-xs font-semibold ${passwordStrength.color}`}
                  >
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              {/* Strength bars */}
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4].map((level) => {
                  const passed = passwordRequirements.filter((r) => r.test(formData.password)).length;
                  const filled = passed >= level + (level > 2 ? 1 : 0);
                  const barColor = passed <= 2 ? "bg-red-500" : passed <= 4 ? "bg-amber-500" : "bg-green-500";
                  return (
                    <div key={level} className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${filled ? barColor : ""}`}
                        style={{ width: filled ? "100%" : "0%" }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                {passwordRequirements.map((req, index) => {
                  const isPassed = req.test(formData.password);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      {isPassed ? (
                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`text-xs ${isPassed ? "text-green-700" : "text-slate-600"}`}
                      >
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          icon={<Lock className="w-5 h-5" />}
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          error={errors.confirmPassword}
          disabled={isLoading}
          autoComplete="new-password"
          showPasswordToggle
        />

        <div>
          <Checkbox
            id="agree-terms"
            label={
              <span className="text-sm text-slate-700">
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Privacy Policy
                </a>
              </span>
            }
            checked={formData.agreeToTerms}
            onChange={(checked) =>
              handleChange("agreeToTerms", checked === true)
            }
            onBlur={() => handleBlur("agreeToTerms")}
            disabled={isLoading}
            error={errors.agreeToTerms}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading}
          loading={isLoading}
        >
          Create account
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={handleGoogleSignup}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-sm sm:text-base text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Sign in
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <p className="text-xs text-slate-500">
            Enterprise-grade security & privacy
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
