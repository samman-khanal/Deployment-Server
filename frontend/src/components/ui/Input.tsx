import React, { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label: string;
  hideLabel?: boolean;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  hideLabel = false,
  error,
  helperText,
  icon,
  className = "",
  disabled,
  onChange,
  onFocus,
  onBlur,
  type,
  showPasswordToggle = false,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password";
  const shouldShowToggle = isPasswordField && showPasswordToggle;
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <div className="w-full">
      {hideLabel ? (
        <label className="sr-only">{label}</label>
      ) : (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={`
            w-full px-4 py-2.5 
            ${icon ? "pl-11" : ""} 
            ${shouldShowToggle ? "pr-11" : ""}
            bg-white border rounded-lg 
            text-slate-900 placeholder:text-slate-400
            transition-all duration-200
            focus:outline-none focus:ring-2 
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
            }
            ${disabled ? "bg-slate-50 cursor-not-allowed opacity-60" : "hover:border-slate-400"}
            ${className}
          `}
          disabled={disabled}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${props.id}-error`
              : helperText
                ? `${props.id}-helper`
                : undefined
          }
          {...props}
        />
        {shouldShowToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={`${props.id}-error`}
          className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${props.id}-helper`} className="mt-1.5 text-sm text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
