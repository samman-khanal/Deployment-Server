import { Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";

interface ChangePasswordFormProps {
  show: boolean;
  newPassword: string;
  confirmPassword: string;
  saving: boolean;
  passwordChangedAt?: string;
  onToggle: () => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "6+ characters", ok: password.length >= 6 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-green-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score] : "bg-slate-200 dark:bg-slate-600"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-[10px] font-medium ${c.ok ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}
            >
              {c.label}
            </span>
          ))}
        </div>
        <span className={`text-[11px] font-semibold ${score >= 3 ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
          {labels[score]}
        </span>
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  placeholder,
  show,
  onToggle,
  onChange,
}: {
  value: string;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-11 text-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-slate-400 transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function ChangePasswordForm({
  show,
  newPassword,
  confirmPassword,
  saving,
  passwordChangedAt,
  onToggle,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSave,
  onCancel,
}: ChangePasswordFormProps) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Account Security</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your password</p>
            </div>
          </div>
          {!show && (
            <button
              onClick={onToggle}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Change Password
            </button>
          )}
        </div>
      </div>

      {show && (
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              New Password
            </label>
            <PasswordInput
              value={newPassword}
              placeholder="Enter new password"
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              onChange={onNewPasswordChange}
            />
            <PasswordStrength password={newPassword} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Confirm Password
            </label>
            <PasswordInput
              value={confirmPassword}
              placeholder="Confirm new password"
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              onChange={onConfirmPasswordChange}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">Passwords match</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-200 dark:shadow-none disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!show && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              ))}
            </div>
            <span>
              {passwordChangedAt
                ? `Last changed ${new Date(passwordChangedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                : "Last changed —"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// useState is used inside the component, need to import it
import { useState } from "react";
