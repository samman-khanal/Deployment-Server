import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { getAvatarTheme, getInitials } from "./workspaceTheme";

const LOADING_MESSAGES = [
  "Tuning channels...",
  "Gathering your team...",
  "Loading conversations...",
  "Preparing your boards...",
  "Almost there...",
];

export default function WorkspaceLauncher() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const location = useLocation();

  const workspaceName = useMemo(() => {
    const fromState = (location.state as { workspaceName?: string })?.workspaceName;
    if (typeof fromState === "string" && fromState.trim()) return fromState;

    if (workspaceId) {
      try {
        const cached = sessionStorage.getItem(`workspaceName:${workspaceId}`);
        if (typeof cached === "string" && cached.trim()) return cached;
      } catch {
        // ignore storage failures
      }
    }

    return "Workspace";
  }, [location.state, workspaceId]);

  const theme = useMemo(
    () => getAvatarTheme(workspaceId || workspaceName),
    [workspaceId, workspaceName],
  );

  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  // Cycle through loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass("opacity-0");
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        setFadeClass("opacity-100");
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Navigate to actual workspace after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/workspaces/${workspaceId}`, { replace: true });
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate, workspaceId]);

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-slate-50 to-white flex items-center justify-center relative overflow-hidden">
      {/* Subtle background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-40 w-125 h-125 bg-indigo-100/55 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-40 w-125 h-125 bg-fuchsia-100/45 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center -translate-y-20">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-10 mt-0.5">
          <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-fuchsia-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-[13px] tracking-tight">CS</span>
          </div>
          <span className="text-[18px] font-semibold text-slate-900 tracking-tight">
            CollabSpace
          </span>
        </div>

        {/* Spinner + Avatar */}
        <div className="relative mb-7">
          {/* Outer ring spinner */}
          <svg
            className="w-26 h-26 animate-spin-slow"
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="#eef2ff"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="url(#gradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="339.292"
              strokeDashoffset="250"
            />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="120" y2="120">
                <stop stopColor={theme.fromHex} />
                <stop offset="0.55" stopColor={theme.accentHex} />
                <stop offset="1" stopColor={theme.toHex} />
              </linearGradient>
            </defs>
          </svg>

          {/* Center avatar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-14 h-14 bg-linear-to-br ${theme.fromClass} ${theme.toClass} rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/70`}
            >
              <span className="text-white font-bold text-lg tracking-tight">
                {getInitials(workspaceName)}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 text-center px-4">
          Launching {workspaceName}
        </h1>

        {/* Animated loading message */}
        <p
          className={`text-sm text-slate-400 transition-opacity duration-300 ${fadeClass}`}
        >
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Inline style for custom spin animation */}
      <style>{`
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
