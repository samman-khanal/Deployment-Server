import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    px-4 py-2.5 rounded-lg font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
  `;

  const variants = {
    primary: `
      bg-indigo-600 text-white
      hover:bg-indigo-700 active:bg-indigo-800
      focus:ring-indigo-500
      shadow-sm hover:shadow-md
      disabled:bg-indigo-400 disabled:hover:bg-indigo-400 disabled:shadow-none
    `,
    outline: `
      bg-white text-slate-700 border border-slate-300
      hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100
      focus:ring-slate-500
      disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200
      disabled:hover:bg-slate-50
    `,
    ghost: `
      bg-transparent text-slate-700
      hover:bg-slate-100 active:bg-slate-200
      focus:ring-slate-500
      disabled:text-slate-400 disabled:hover:bg-transparent
    `,
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
