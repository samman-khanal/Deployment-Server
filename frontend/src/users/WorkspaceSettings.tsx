import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Settings,
  Users,
  X,
  Shield,
  Crown,
  UserMinus,
  Trash2,
  Mail,
  AlertTriangle,
  Check,
  Send,
  Loader2,
  Hash,
  CalendarDays,
  UserCheck,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";

import workspaceService from "../services/workspace.service";
import workspaceMemberService from "../services/workspaceMember.service";

import type { Workspace } from "../services/workspace.service";
import type { Channel } from "../services/channel.service";
import type { WorkspaceMember, WorkspaceInvite } from "../services/workspaceMember.service";

/** Return up to 2 uppercase initials from a name string. */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

type SettingsTab = "general" | "members" | "danger";

interface WorkspaceSettingsProps {
  workspace: Workspace | null;
  members: WorkspaceMember[];
  channels: Channel[];
  onClose: () => void;
  onWorkspaceUpdate: (ws: Workspace) => void;
  onMembersChange: (members: WorkspaceMember[]) => void;
}

export default function WorkspaceSettings({
  workspace,
  members,
  channels,
  onClose,
  onWorkspaceUpdate,
  onMembersChange,
}: WorkspaceSettingsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");

  // General
  const [editName, setEditName] = useState(workspace?.name || "");
  const [editDescription, setEditDescription] = useState(workspace?.description || "");
  const [isSaving, setIsSaving] = useState(false);

  // Members
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<WorkspaceInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Danger
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Role helpers
  const myMember = useMemo(() => members.find((m) => m.user?._id === user?.id), [members, user]);
  const isOwner = myMember?.role === "owner";
  const isAdmin = myMember?.role === "admin" || isOwner;

  // Fetch pending invites when members tab is active
  const fetchInvites = useCallback(async () => {
    if (!workspace?._id) return;
    setLoadingInvites(true);
    try {
      const list = await workspaceMemberService.listInvites(workspace._id);
      setPendingInvites(list.filter((i) => i.status === "PENDING"));
    } catch {
      // silently ignore
    } finally {
      setLoadingInvites(false);
    }
  }, [workspace?._id]);

  useEffect(() => {
    if (settingsTab === "members") fetchInvites();
  }, [settingsTab, fetchInvites]);

  // ─── Handlers ────────────────────────────────────────
  const handleSaveGeneral = async () => {
    if (!workspace?._id) return;
    setIsSaving(true);
    try {
      const updated = await workspaceService.update(workspace._id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      onWorkspaceUpdate({ ...workspace, ...updated });
      toast.success("Workspace updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update workspace");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!workspace?._id || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await workspaceMemberService.invite(workspace._id, inviteEmail.trim());
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
      fetchInvites(); // refresh pending list
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, role: string) => {
    if (!workspace?._id) return;
    try {
      const updated = await workspaceMemberService.changeRole(workspace._id, memberId, role);
      onMembersChange(members.map((m) => (m._id === memberId ? { ...m, role: updated.role } : m)));
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change role");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!workspace?._id) return;
    if (!confirm(`Remove ${memberName} from this workspace?`)) return;
    try {
      await workspaceMemberService.remove(workspace._id, memberId);
      onMembersChange(members.filter((m) => m._id !== memberId));
      toast.success(`${memberName} removed`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    }
  };

  const handleCancelInvite = async (invite: WorkspaceInvite) => {
    if (!workspace?._id) return;
    setCancellingId(invite._id);
    try {
      await workspaceMemberService.cancelInvite(workspace._id, invite._id);
      setPendingInvites((prev) => prev.filter((i) => i._id !== invite._id));
      toast.success(`Invitation to ${invite.email} cancelled`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel invitation");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace?._id) return;
    if (deleteConfirm !== workspace.name) {
      toast.error("Please type the workspace name to confirm deletion");
      return;
    }
    setIsDeleting(true);
    try {
      await workspaceService.remove(workspace._id);
      toast.success("Workspace deleted");
      navigate("/selector");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs: { key: SettingsTab; label: string; icon: typeof Settings }[] = [
    { key: "general", label: "General", icon: Settings },
    { key: "members", label: "Members", icon: Users },
    { key: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  // ─── Render ──────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">

        {/* ── Header ── */}
        <div className="relative overflow-hidden shrink-0">

          <div className="px-6 pt-5 pb-4 flex items-start gap-4">
            {/* Workspace avatar */}
            <div className="w-12 h-12 bg-slate-800 dark:bg-slate-700 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0">
              {getInitials(workspace?.name || "WS")}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none truncate">
                {workspace?.name || "Workspace"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Workspace Settings
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSettingsTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  settingsTab === tab.key
                    ? tab.key === "danger"
                      ? "border-red-500 text-red-600 dark:text-red-400"
                      : "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white"
                    : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="border-b border-slate-200 dark:border-slate-700" />
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── General Tab ── */}
          {settingsTab === "general" && (
            <div className="p-6 space-y-6">

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{members.length}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Members</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      <Hash className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{channels.length}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Channels</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Created date */}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <CalendarDays className="w-4 h-4" />
                <span>Created {workspace?.createdAt ? new Date(workspace.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Workspace Name
                </label>
                <Input
                  label="Workspace Name"
                  hideLabel
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!isAdmin || isSaving}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={!isAdmin || isSaving}
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:opacity-60 resize-none text-sm"
                  placeholder="What's this workspace for?"
                />
              </div>

              {isAdmin && (
                <button
                  onClick={handleSaveGeneral}
                  disabled={isSaving || !editName.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                  ) : (
                    <><Check className="w-4 h-4" />Save Changes</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── Members Tab ── */}
          {settingsTab === "members" && (
            <div className="p-6 space-y-5">

              {/* Invite card */}
              {isAdmin && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Invite a teammate</h4>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      label="Email"
                      hideLabel
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={isInviting}
                      className="flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") handleInviteMember(); }}
                    />
                    <button
                      onClick={handleInviteMember}
                      disabled={isInviting || !inviteEmail.trim()}
                      className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                      {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* Pending invitations */}
              {isAdmin && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Pending Invitations
                    {!loadingInvites && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full">
                        {pendingInvites.length}
                      </span>
                    )}
                  </h4>

                  {loadingInvites ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading…
                    </div>
                  ) : pendingInvites.length === 0 ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Mail className="w-3.5 h-3.5" />
                      No pending invitations
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {pendingInvites.map((invite) => (
                        <div
                          key={invite._id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 group"
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                            <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {invite.email}
                            </p>
                            {invite.createdAt && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                Sent {new Date(invite.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-full shrink-0">
                            Pending
                          </span>
                          <button
                            onClick={() => handleCancelInvite(invite)}
                            disabled={cancellingId === invite._id}
                            className="w-7 h-7 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                            title="Cancel invitation"
                          >
                            {cancellingId === invite._id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members heading */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  Members
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">{members.length}</span>
                </h4>
              </div>

              {/* Members list */}
              <div className="space-y-1.5">
                {members.map((member) => {
                  const name = member.user?.fullName || "User";
                  const email = member.user?.email || "";
                  const isSelf = member.user?._id === user?.id;
                  const memberIsOwner = member.role === "owner";
                  const memberIsAdmin = member.role === "admin";
                  // Admins can only remove regular members; only owners can remove admins
                  const canRemove =
                    !isSelf &&
                    !memberIsOwner &&
                    (isOwner || (!memberIsAdmin && isAdmin));
                  return (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-slate-700 dark:bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {getInitials(name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{name}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{email}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {memberIsOwner ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1 rounded-full">
                            <Crown className="w-3 h-3" />
                            Owner
                          </span>
                        ) : isAdmin && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member._id, e.target.value)}
                            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        )}

                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member._id, name)}
                            className="w-7 h-7 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Remove member"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Danger Zone Tab ── */}
          {settingsTab === "danger" && (
            <div className="p-6">
              {isOwner ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  {/* Warning header */}
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Delete Workspace</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This action is permanent and cannot be undone</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-slate-800/30 space-y-5">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      All channels, messages, boards, and member data associated with{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">{workspace?.name}</span>{" "}
                      will be permanently removed.
                    </p>

                    <div className="p-4 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Before you delete:</p>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                        <li>Export any data you want to keep</li>
                        <li>Notify members before deleting</li>
                        <li>This cannot be reversed</li>
                      </ul>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Type <span className="text-red-600 dark:text-red-400 font-bold">{workspace?.name}</span> to confirm:
                      </label>
                      <Input
                        label="Confirm workspace name"
                        hideLabel
                        type="text"
                        placeholder={workspace?.name || "workspace name"}
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        disabled={isDeleting}
                      />
                    </div>

                    <button
                      onClick={handleDeleteWorkspace}
                      disabled={isDeleting || deleteConfirm !== workspace?.name}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                    >
                      {isDeleting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</>
                      ) : (
                        <><Trash2 className="w-4 h-4" />Permanently Delete Workspace</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Owner access required</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto">
                    Only the workspace owner can access the danger zone.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
