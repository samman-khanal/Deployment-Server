import type { ReactNode } from "react";
import { Check } from "lucide-react";

interface CheckboxProps {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  onBlur?: () => void;
  error?: string;
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  onBlur,
  error,
}: CheckboxProps) {
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          id={id}
          onClick={() => !disabled && onChange(!checked)}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all duration-200 shrink-0
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
            ${
              checked
                ? "bg-indigo-600 border-indigo-600"
                : error
                  ? "bg-white border-red-300 hover:border-red-400"
                  : "bg-white border-slate-300 hover:border-slate-400"
            }
            ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {checked && (
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          )}
        </button>
        <label
          htmlFor={id}
          className={`text-sm text-slate-700 select-none ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
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
    </div>
  );
}
