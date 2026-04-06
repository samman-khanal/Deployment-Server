import React, { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

interface TouchedFields {
  password: boolean;
  confirmPassword: boolean;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const token = tokenFromPath || searchParams.get("token");

  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    password: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">
            Invalid or expired link
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-6">
            Please request a new password reset link.
          </p>
          <Button onClick={() => navigate("/forgot-password")}>
            Request new link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return "Password must contain uppercase and lowercase letters";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return undefined;
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string,
  ): string | undefined => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password,
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Also clear confirm password error if password changes
    if (field === "password" && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate field on blur
    let fieldError: string | undefined;
    if (field === "password") {
      fieldError = validatePassword(formData.password);
    } else if (field === "confirmPassword") {
      fieldError = validateConfirmPassword(
        formData.confirmPassword,
        formData.password,
      );
    }

    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      password: true,
      confirmPassword: true,
    });

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: formData.password,
        password: formData.password,
      });

      toast.success("Password reset successful!", {
        description: "You can now sign in with your new password",
      });

      // Navigate to login after success
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Reset link is invalid or has expired. Please request a new one.";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Create a strong password to secure your CollabSpace account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              id="password"
              type="password"
              label="New Password"
              placeholder="Enter your new password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              error={touched.password ? errors.password : undefined}
              disabled={isLoading}
              icon={<Lock className="w-5 h-5" />}
              showPasswordToggle
              autoComplete="new-password"
              autoFocus
            />
            {formData.password && (
              <div className="mt-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-700">
                      Password strength:
                    </p>
                    <span
                      className={`text-xs font-semibold ${
                        passwordStrength === 0
                          ? ""
                          : passwordStrength === 1
                            ? "text-red-600"
                            : passwordStrength === 2
                              ? "text-orange-600"
                              : passwordStrength === 3
                                ? "text-yellow-600"
                                : "text-green-600"
                      }`}
                    >
                      {passwordStrength === 0
                        ? ""
                        : passwordStrength === 1
                          ? "Weak"
                          : passwordStrength === 2
                            ? "Fair"
                            : passwordStrength === 3
                              ? "Good"
                              : "Strong"}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === 0
                          ? "w-0 bg-slate-300"
                          : passwordStrength === 1
                            ? "w-1/4 bg-red-500"
                            : passwordStrength === 2
                              ? "w-1/2 bg-orange-500"
                              : passwordStrength === 3
                                ? "w-3/4 bg-yellow-500"
                                : "w-full bg-green-500"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
            disabled={isLoading}
            icon={<Lock className="w-5 h-5" />}
            showPasswordToggle
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              "Resetting Password..."
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Reset Password
              </>
            )}
          </Button>
        </form>

        {/* Password Requirements */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm font-semibold text-slate-900 mb-2">
            Password must contain:
          </p>
          <ul className="space-y-1 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? "bg-green-500" : "bg-slate-300"}`}
              />
              At least 8 characters
            </li>
            <li className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? "bg-green-500" : "bg-slate-300"}`}
              />
              Uppercase and lowercase letters
            </li>
            <li className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${/(?=.*\d)/.test(formData.password) ? "bg-green-500" : "bg-slate-300"}`}
              />
              At least one number
            </li>
            <li className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${/[^a-zA-Z0-9]/.test(formData.password) ? "bg-green-500" : "bg-slate-300"}`}
              />
              Special character (recommended)
            </li>
          </ul>
        </div>

        {/* Back to Login */}
        <p className="mt-8 text-center text-sm sm:text-base text-slate-600">
          Remember your password?{" "}
          <a
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
