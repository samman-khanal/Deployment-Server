import { useRef, useEffect } from "react";
import { User, Settings, LogOut } from "lucide-react";

/** Return up to 2 uppercase initials from a name string. */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

interface UserMenuProps {
  fullName: string;
  email: string;
  avatarUrl?: string;
  onProfile: () => void;
  onPreferences: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export default function UserMenu({
  fullName,
  email,
  avatarUrl,
  onProfile,
  onPreferences,
  onSignOut,
  onClose,
}: UserMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const items = [
    {
      label: "My Profile",
      icon: User,
      onClick: onProfile,
      color: "text-slate-600 dark:text-slate-300",
      hoverBg: "hover:bg-slate-50 dark:hover:bg-slate-700",
    },
    {
      label: "Preferences",
      icon: Settings,
      onClick: onPreferences,
      color: "text-slate-600 dark:text-slate-300",
      hoverBg: "hover:bg-slate-50 dark:hover:bg-slate-700",
    },
    {
      label: "Sign Out",
      icon: LogOut,
      onClick: onSignOut,
      color: "text-red-600 dark:text-red-400",
      hoverBg: "hover:bg-red-50 dark:hover:bg-red-900/30",
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-150"
    >
      {/* User header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(fullName)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
              {fullName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-1.5">
        {items.map(({ label, icon: Icon, onClick, color, hoverBg }, idx) => (
          <div key={label}>
            {idx === items.length - 1 && (
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
            )}
            <button
              onClick={() => {
                onClick();
                if (label !== "Sign Out") onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${hoverBg} transition-all group`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className={`text-sm font-medium ${color}`}>{label}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
