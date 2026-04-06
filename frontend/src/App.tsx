import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Login from "./auth/Login";
import Register from "./auth/Register";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import VerifyEmail from "./auth/VerifyEmail";
import GoogleCallback from "./auth/GoogleCallback";
import Contact from "./pages/Contact";
import About from "./pages/About";
import WorkspaceSelector from "./users/WorkspaceSelector";
import WorkspaceLauncher from "./users/WorkspaceLauncher";
import {
  SubscriptionPage,
  UpgradePage,
  SubscriptionSuccessPage,
  KhaltiCallbackPage,
} from "./pages/subscription";
import AcceptInvite from "./pages/AcceptInvite";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

// Modular workspace layout & pages
import { WorkspaceProvider } from "./features/workspace/WorkspaceContext";
import WorkspaceLayout from "./features/workspace/WorkspaceLayout";
import OverviewPage from "./features/workspace/OverviewPage";
import ProfilePage from "./features/workspace/ProfilePage";
import PreferencesPage from "./features/workspace/PreferencesPage";
import NotificationsPage from "./features/workspace/NotificationsPage";
import SettingsPage from "./features/workspace/SettingsPage";
import ChannelPage from "./features/channels/ChannelPage";
import DMPage from "./features/dms/DMPage";
import BoardPage from "./features/boards/BoardPage";

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <Toaster
          position="top-right"
          richColors
          expand={false}
          closeButton
          toastOptions={{
            duration: 3000,
            style: {
              padding: "16px",
              gap: "12px",
            },
            classNames: {
              toast: "flex items-start gap-3 shadow-lg border",
              title: "text-sm font-semibold",
              description: "text-sm",
              success: "border-green-200 bg-green-50",
              error: "border-red-200 bg-red-50",
              warning: "border-amber-200 bg-amber-50",
              info: "border-blue-200 bg-blue-50",
            },
          }}
        />
        <div className="page-transition">
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<WorkspaceSelector />} />
          <Route path="/selector" element={<WorkspaceSelector />} />
          <Route path="/workspaces/:workspaceId/launch" element={<WorkspaceLauncher />} />

          {/* Workspace — nested routes with shared layout */}
          <Route
            path="/workspaces/:workspaceId"
            element={
              <ErrorBoundary>
                <WorkspaceProvider>
                  <WorkspaceLayout />
                </WorkspaceProvider>
              </ErrorBoundary>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="channels/:channelId" element={<ChannelPage />} />
            <Route path="dms/:dmId" element={<DMPage />} />
            <Route path="boards" element={<BoardPage />} />
            <Route path="boards/:boardId" element={<BoardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="preferences" element={<PreferencesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Subscription Routes */}
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/subscription/upgrade" element={<UpgradePage />} />
          <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
          <Route path="/subscription/khalti-callback" element={<KhaltiCallbackPage />} />
          {/* Workspace invite */}
          <Route path="/invite/accept" element={<AcceptInvite />} />
        </Routes>
        </div>
      </div>
  );
}
