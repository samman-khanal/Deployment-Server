import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = searchParams.get("error");
    if (error) {
      const messages: Record<string, string> = {
        google_cancelled: "Google sign-in was cancelled.",
        google_failed: "Google sign-in failed. Please try again.",
      };
      toast.error(messages[error] ?? "Authentication failed. Please try again.");
      navigate("/login", { replace: true });
      return;
    }

    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (!token || !userParam) {
      toast.error("Authentication failed. Please try again.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(userParam);
      login(token, user, true);
      toast.success(`Welcome, ${user.fullName}!`);

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      toast.error("Authentication failed. Please try again.");
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Signing you in with Google…</p>
      </div>
    </div>
  );
}
