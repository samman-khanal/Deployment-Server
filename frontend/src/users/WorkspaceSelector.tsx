import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Plus,
  Users,
  X,
  Building2,
  Loader2,
  Check,
  Sparkles,
  Hash,
  MessageSquare,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SubscriptionCard } from "../components/ui/SubscriptionCard";
import { UpgradeLimitModal } from "../components/ui/UpgradeLimitModal";
import workspaceService from "../services/workspace.service";
import type { Workspace } from "../services/workspace.service";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../context/SubscriptionContext";
import { getAvatarTheme, getInitials } from "./workspaceTheme";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface WorkspaceSelectorProps {
  userEmail?: string;
}

export default function WorkspaceSelector({
  userEmail,
}: WorkspaceSelectorProps) {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkWorkspaceLimit } = useSubscription();

  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {},
  );

  // Subscription limit modal state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ currentCount: number; limit: number }>({
    currentCount: 0,
    limit: 5,
  });

  const storedEmail = useMemo(() => {
    try {
      const raw =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed?.email === "string" ? parsed.email : null;
    } catch {
      return null;
    }
  }, []);

  const displayEmail = user?.email || storedEmail || userEmail || "";

  const workspaceCards = useMemo(() => {
    const list = workspaces ?? [];
    return list
      .filter((ws) => !!ws._id)
      .map((ws) => {
        const key = ws._id || ws.name;
        const theme = getAvatarTheme(key);
        return {
          id: ws._id,
          name: ws.name,
          avatar: getInitials(ws.name),
          members: ws.memberCount ?? 1,
          theme,
        };
      });
  }, [workspaces]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoadingWorkspaces(true);
      try {
        const data = await workspaceService.listMine();
        if (isMounted) setWorkspaces(data);
      } catch (err: any) {
        if (isMounted) setWorkspaces([]);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load workspaces";
        toast.error(message);
      } finally {
        if (isMounted) setIsLoadingWorkspaces(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {};

    if (!workspaceName.trim()) {
      newErrors.name = "Workspace name is required";
    } else if (workspaceName.trim().length < 3) {
      newErrors.name = "Workspace name must be at least 3 characters";
    }

    if (!workspaceDescription.trim()) {
      newErrors.description = "Description is required";
    } else if (workspaceDescription.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateWorkspace = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const created = await workspaceService.create({
        name: workspaceName,
        description: workspaceDescription,
      });

      toast.success("Workspace created successfully!");
      setIsCreateModalOpen(false);
      setWorkspaceName("");
      setWorkspaceDescription("");
      setErrors({});
      setWorkspaces((prev) => (prev ? [created, ...prev] : [created]));

      if (created?._id) {
        localStorage.setItem("workspaceId", created._id);
        try {
          sessionStorage.setItem(`workspaceName:${created._id}`, created.name);
        } catch {
          // ignore storage failures
        }
        navigate(`/workspaces/${created._id}/launch`, {
          state: { workspaceName: created.name },
        });
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create workspace";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleWorkspaceClick = (workspaceId: string, workspaceName: string) => {
    localStorage.setItem("workspaceId", workspaceId);
    try {
      sessionStorage.setItem(`workspaceName:${workspaceId}`, workspaceName);
    } catch {
      // ignore storage failures
    }
    navigate(`/workspaces/${workspaceId}/launch`, {
      state: { workspaceName },
    });
  };

  // Check workspace limit before opening create modal
  const handleOpenCreateModal = async () => {
    try {
      const result = await checkWorkspaceLimit();
      if (!result.allowed) {
        setLimitInfo({
          currentCount: result.currentCount || 0,
          limit: result.limit || 5,
        });
        setShowLimitModal(true);
        return;
      }
      setIsCreateModalOpen(true);
    } catch {
      // If check fails, allow opening modal (backend will enforce limit)
      setIsCreateModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-155">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-11 h-11 bg-linear-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg tracking-tight">CS</span>
            </div>
            <span className="text-[22px] font-bold text-slate-900 tracking-tight">CollabSpace</span>
          </div>
          <h1 className="text-[28px] font-bold text-slate-900 mb-2">
            {workspaceCards.length > 0
              ? "Welcome back!"
              : "Welcome to CollabSpace!"}
          </h1>
          <p className="text-[15px] text-slate-500">
            {workspaceCards.length > 0
              ? "Choose a workspace to get back to work with your team."
              : "Create your first workspace to start collaborating with your team."}
          </p>
        </div>

        {isLoadingWorkspaces && workspaces === null ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="h-3 bg-slate-200 rounded animate-pulse w-28 mb-2" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-44" />
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3.5 px-6 py-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-slate-200 rounded animate-pulse w-40 mb-2" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-24" />
                  </div>
                  <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : workspaceCards.length > 0 ? (
          <>
            {/* Workspace List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide">
                  Ready to launch
                </p>
                <p className="text-[13px] text-slate-500 mt-0.5">{displayEmail}</p>
              </div>

              <div className="divide-y divide-slate-100">
                {workspaceCards.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceClick(workspace.id, workspace.name)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 bg-linear-to-br ${workspace.theme.fromClass} ${workspace.theme.toClass} rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm shadow-slate-200/70`}
                      >
                        {workspace.avatar}
                      </div>
                      <div className="text-left">
                        <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
                          {workspace.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Member avatar dots */}
                          <div className="flex items-center -space-x-1">
                            {Array.from({ length: Math.min(workspace.members, 2) }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-4 h-4 ${workspace.theme.dots[i % workspace.theme.dots.length]} rounded-full border-[1.5px] border-white`}
                              />
                            ))}
                            {workspace.members > 2 && (
                              <div className="w-4 h-4 bg-slate-300 rounded-full border-[1.5px] border-white flex items-center justify-center">
                                <span className="text-[7px] font-bold text-slate-600">+{workspace.members - 2}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[13px] text-slate-500">
                            {workspace.members} {workspace.members === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[13px] font-medium text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Create Workspace Section */}
            <div>
              <p className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide mb-3">
                Create new workspace
              </p>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={handleOpenCreateModal}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      Create a new workspace
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="text-center py-12 px-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <LayoutGrid className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Create your first workspace
              </h2>
              <p className="text-[15px] text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Workspaces bring your team's communication and projects together in one place.
              </p>

              <Button
                onClick={handleOpenCreateModal}
                className="gap-2 px-8 py-3 mb-10"
              >
                <Plus className="w-5 h-5" />
                Create Your First Workspace
              </Button>

              <div className="border-t border-slate-100 pt-8 max-w-md mx-auto">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  Everything you need to collaborate
                </p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    { icon: Hash, label: "Channels", desc: "Organized conversations" },
                    { icon: MessageSquare, label: "Messaging", desc: "Real-time chat" },
                    { icon: LayoutGrid, label: "Boards", desc: "Task management" },
                    { icon: Users, label: "Teams", desc: "Invite & collaborate" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <span className="text-[13px] font-semibold text-slate-800 block">
                          {item.label}
                        </span>
                        <span className="text-[12px] text-slate-400">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Card */}
        <div className="mt-8">
          <p className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide mb-3">
            Your Plan
          </p>
          <SubscriptionCard compact />
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-[12px] text-slate-400 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-slate-500 underline underline-offset-2 hover:text-slate-700">
              main services agreement
            </a>
            ,{" "}
            <a href="#" className="text-slate-500 underline underline-offset-2 hover:text-slate-700">
              user terms of service
            </a>{" "}
            and{" "}
            <a href="#" className="text-slate-500 underline underline-offset-2 hover:text-slate-700">
              privacy policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <>
          <div
            onClick={() => !isCreating && setIsCreateModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Create a workspace
                    </h2>
                    <p className="text-sm text-slate-700">
                      Set up your team collaboration space
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isCreating && setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="workspace-name"
                      className="block text-sm font-semibold text-slate-900 mb-2"
                    >
                      Workspace Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      label="Workspace Name"
                      hideLabel
                      id="workspace-name"
                      type="text"
                      placeholder="e.g., Marketing Team, Dev Squad..."
                      value={workspaceName}
                      onChange={(e) => {
                        setWorkspaceName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      className={errors.name ? "border-red-500 focus:ring-red-500" : ""}
                      disabled={isCreating}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Choose a name that represents your team or project.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="workspace-description"
                      className="block text-sm font-semibold text-slate-900 mb-2"
                    >
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="workspace-description"
                      rows={4}
                      placeholder="Describe what this workspace is for..."
                      value={workspaceDescription}
                      onChange={(e) => {
                        setWorkspaceDescription(e.target.value);
                        if (errors.description)
                          setErrors({ ...errors, description: undefined });
                      }}
                      className={`w-full px-4 py-3 bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                        errors.description
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                      disabled={isCreating}
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Help your team understand the purpose of this workspace.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      What's a workspace?
                    </h4>
                    <p className="text-xs text-blue-800">
                      A workspace is your team's central hub for collaboration.
                      It includes channels for communication, boards for project
                      management, and shared resources.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Your workspace includes:
                    </h4>
                    <div className="space-y-2">
                      {[
                        "Unlimited channels and conversations",
                        "Task boards and project management",
                        "File sharing and collaboration",
                        "Video calls and screen sharing",
                        "Team member invitations",
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={isCreating}
                    className="flex-1 gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" />
                        Create Workspace
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upgrade Limit Modal */}
      <UpgradeLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        type="workspace"
        currentCount={limitInfo.currentCount}
        limit={limitInfo.limit}
      />
    </div>
  );
}