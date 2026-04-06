import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, Loader2, Building2, Mail, Users, ArrowRight, CalendarClock } from "lucide-react";
import { api } from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface InvitePreview {
  workspaceName: string;
  email: string;
  expiresAt: string;
}

function formatRelativeExpiry(dateStr: string): string {
  const now = new Date();
  const expiry = new Date(dateStr);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Expires in less than an hour";
  if (diffHours < 24) return `Expires in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
  const diffDays = Math.floor(diffHours / 24);
  return `Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

export default function AcceptInvite() {
  useDocumentTitle("Accept Invitation");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const token = searchParams.get("token");

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Fetch invite preview (no auth required)
  useEffect(() => {
    if (!token) {
      setPreviewError("No invitation token found.");
      setLoadingPreview(false);
      return;
    }
    api
      .get(`/workspaces/invites/${token}`)
      .then((res) => setPreview(res.data))
      .catch((err) => {
        const msg =
          err.response?.data?.message ?? "This invitation is invalid or has expired.";
        setPreviewError(msg);
      })
      .finally(() => setLoadingPreview(false));
  }, [token]);

  // Countdown after acceptance
  useEffect(() => {
    if (!accepted || !workspaceId) return;
    let count = 3;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        navigate(`/workspaces/${workspaceId}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [accepted, workspaceId, navigate]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${returnTo}`);
      return;
    }

    try {
      setAccepting(true);
      const res = await api.post(`/workspaces/invites/${token}/accept`);
      setWorkspaceId(res.data.workspaceId);
      setAccepted(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to accept invitation.";
      setPreviewError(message);
    } finally {
      setAccepting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loadingPreview) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-60" />
            <div className="relative w-20 h-20 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Loading Invitation</h2>
          <p className="text-sm text-slate-500">Just a moment…</p>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (previewError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="h-1 bg-red-400" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Invitation Unavailable</h2>
            <p className="text-slate-500 text-sm mb-8">{previewError}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ───────────────────────────────────────────────────────────────
  if (accepted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
        {/* Decorative blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-md w-full">
          {/* Animated check icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 scale-150 animate-ping" />
              <div className="relative w-24 h-24 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="h-1 bg-linear-to-r from-emerald-400 to-indigo-500" />
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">You're in!</h1>
              <p className="text-slate-500 text-sm mb-6">
                You've successfully joined{" "}
                <span className="font-semibold text-indigo-600">{preview?.workspaceName}</span>.
              </p>

              {/* Workspace badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full mb-8 max-w-full">
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold truncate">{preview?.workspaceName}</span>
              </div>

              {/* Countdown */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-slate-600 text-sm mb-3">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  <span>
                    Taking you to the workspace in{" "}
                    <span className="font-bold text-indigo-600">{countdown}s</span>…
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Invite preview ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative max-w-md w-full">
        {/* App logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">CollabSpace</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Colored header */}
          <div className="bg-indigo-600 px-8 py-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-1">You're Invited!</h1>
              <p className="text-indigo-200 text-sm">
                You've been invited to join a workspace
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Workspace + email info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Workspace</p>
                  <p className="text-sm font-bold text-slate-800">{preview?.workspaceName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Invited email</p>
                  <p className="text-sm font-bold text-slate-800">{preview?.email}</p>
                </div>
              </div>
            </div>

            {/* Login notice */}
            {!isAuthenticated && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg mb-5 text-left">
                <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-700 text-xs font-bold">!</span>
                </div>
                <p className="text-xs text-amber-700 font-medium">
                  You need to be logged in to accept this invitation.
                </p>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Accepting…
                </>
              ) : isAuthenticated ? (
                <>
                  <Users className="w-4 h-4" />
                  Accept Invitation
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Log in to Accept
                </>
              )}
            </button>

            {/* Expiry */}
            {preview?.expiresAt && (
              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
                <CalendarClock className="w-3.5 h-3.5" />
                <span>
                  {formatRelativeExpiry(preview.expiresAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

