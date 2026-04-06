import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Shield, Loader2 } from "lucide-react";

import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  useDocumentTitle("Login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const validateField = (fieldName: string, value: any) => {
    let error = "";

    switch (fieldName) {
      case "email":
        const trimmedEmail = value.trim().toLowerCase();
        if (!trimmedEmail) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          error = "Please enter a valid email address";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
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
    //
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear error when user starts typing
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate email
    const emailError = validateField("email", formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Validate password
    const passwordError = validateField("password", formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);

    setTouched((prev) => ({ ...prev, email: true, password: true }));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!API_BASE_URL)
        throw new Error("Something went wrong. Please try again later.");

      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const res = await axios.post(`${API_BASE_URL}/auth/login`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const { token, user } = res.data;

      if (!token || !user) {
        throw new Error("Login response missing token or user.");
      }

      // Persist auth + update context state
      login(token, user, formData.rememberMe);

      setIsRedirecting(true);

      // Honour ?redirect= param (e.g. invite link)
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        navigate(decodeURIComponent(redirectTo), { replace: true });
        return;
      }

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid credentials. Please try again.";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!API_BASE_URL) {
      toast.error("Service unavailable. Please try again later.");
      return;
    }
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
        </div>
        <p className="text-[15px] font-semibold text-slate-700">Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your CollabSpace workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="w-5 h-5" />}
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={errors.email}
          disabled={isLoading}
          autoComplete="email"
          onBlur={() => handleBlur("email")}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon={<Lock className="w-5 h-5" />}
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={errors.password}
          disabled={isLoading}
          autoComplete="current-password"
          showPasswordToggle
          onBlur={() => handleBlur("password")}
        />

        <div className="flex items-center justify-between">
          <Checkbox
            id="remember-me"
            label="Remember me"
            checked={formData.rememberMe}
            onChange={(checked) =>
              //
              setFormData((prev) => ({ ...prev, rememberMe: checked === true }))
            }
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading}
          loading={isLoading}
        >
          Sign in
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
          onClick={handleGoogleLogin}
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
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Create one
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <p className="text-xs text-slate-500">
            Your data is encrypted and secure
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
