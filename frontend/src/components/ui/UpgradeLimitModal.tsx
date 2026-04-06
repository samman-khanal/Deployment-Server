import { AlertTriangle, Crown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";

interface UpgradeLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "workspace" | "board";
  currentCount: number;
  limit: number;
}

export function UpgradeLimitModal({
  isOpen,
  onClose,
  type,
  currentCount,
  limit,
}: UpgradeLimitModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const title = type === "workspace" ? "Workspace Limit Reached" : "Board Limit Reached";
  const description =
    type === "workspace"
      ? `You've created ${currentCount} out of ${limit} workspaces allowed on the Free plan.`
      : `You've created ${currentCount} out of ${limit} task boards allowed on the Free plan.`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
        <div className="relative p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500">{description}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">
                {type === "workspace" ? "Workspaces" : "Boards"} Used
              </span>
              <span className="font-medium text-slate-900">
                {currentCount} / {limit}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Upgrade Benefits */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-linear-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-indigo-900">Upgrade to Pro</span>
            </div>
            <p className="text-sm text-indigo-700">
              Get unlimited {type === "workspace" ? "workspaces" : "boards"}, permanent
              message history, and more.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                onClose();
                navigate("/subscription/upgrade", {
                  state: { from: "dashboard" },
                });
              }}
              className="flex-1 gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
