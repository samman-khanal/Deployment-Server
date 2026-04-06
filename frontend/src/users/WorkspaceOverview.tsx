import {
  Hash,
  Users,
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Shield,
  Crown,
  UserCheck,
  Eye,
  ChevronRight,
  ArrowRight,
  Bell,
  Sparkles,
  Settings,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Workspace } from "../services/workspace.service";
import type { Channel } from "../services/channel.service";
import type { DMThread } from "../services/dm.service";
import type { WorkspaceMember } from "../services/workspaceMember.service";
import type { Board } from "../services/board.service";

interface WorkspaceOverviewProps {
  workspace: Workspace | null;
  channels: Channel[];
  dms: DMThread[];
  members: WorkspaceMember[];
  boards: Board[];
  currentUserId: string | undefined;
  onSelectChannel: (channelId: string) => void;
  onOpenBoards: () => void;
}

const roleIcon = (role: string) => {
  switch (role) {
    case "owner":  return <Crown className="w-3 h-3 text-amber-400" />;
    case "admin":  return <Shield className="w-3 h-3 text-indigo-300" />;
    case "member": return <UserCheck className="w-3 h-3 text-white/50" />;
    default:       return <Eye className="w-3 h-3 text-white/40" />;
  }
};

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    owner:  "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    admin:  "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    member: "bg-white/10 text-white/60 border border-white/15",
  };
  return map[role] || "bg-white/10 text-white/50 border border-white/15";
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const avatarHues = [
  "bg-indigo-500", "bg-rose-500", "bg-sky-500", "bg-emerald-500",
  "bg-amber-500",  "bg-violet-500", "bg-teal-500", "bg-pink-500",
];

export default function WorkspaceOverview({
  workspace,
  channels,
  dms,
  members,
  boards,
  currentUserId,
  onSelectChannel,
  onOpenBoards,
}: WorkspaceOverviewProps) {
  const navigate = useNavigate();
  const workspaceId = workspace?._id;

  const createdDate = workspace?.createdAt
    ? new Date(workspace.createdAt).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  const myMembership = members.find((m) => m.user._id === currentUserId);
  const myRole = myMembership?.role ?? workspace?.myRole ?? "member";

  const recentChannels = [...channels]
    .sort((a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  const displayMembers = members.slice(0, 8);
  const extraMembers = members.length - 8;

  const stats = [
    { label: "Channels",      value: channels.length, icon: Hash },
    { label: "Members",       value: members.length,  icon: Users },
    { label: "Boards",        value: boards.length,   icon: LayoutDashboard },
    { label: "Conversations", value: dms.length,      icon: MessageSquare },
  ];

  const quickActions = [
    {
      label: "Browse Channels",
      desc: "View all channels",
      icon: Hash,
      onClick: () => channels[0] && onSelectChannel(channels[0]._id),
    },
    {
      label: "Open Boards",
      desc: "Manage your tasks",
      icon: LayoutDashboard,
      onClick: onOpenBoards,
    },
    {
      label: "Notifications",
      desc: "See recent alerts",
      icon: Bell,
      onClick: () => workspaceId && navigate(`/workspaces/${workspaceId}/notifications`),
    },
    {
      label: "Settings",
      desc: "Workspace settings",
      icon: Settings,
      onClick: () => workspaceId && navigate(`/workspaces/${workspaceId}/settings`),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f5f9]">

      {/* ── Hero banner — matches sidebar navy ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1d4d 0%, #252980 60%, #1e2160 100%)" }}
      >
        {/* decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-8 right-40 w-32 h-32 rounded-full bg-indigo-500/10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-violet-500/5 pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0">
                <span className="text-white font-black text-xl select-none">
                  {workspace?.name?.slice(0, 2).toUpperCase() || "WS"}
                </span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {workspace?.name || "Workspace"}
                </h1>
                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                  {createdDate && (
                    <span className="inline-flex items-center gap-1 text-xs text-white/50">
                      <Calendar className="w-3 h-3" />
                      {createdDate}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${roleBadge(myRole)}`}>
                    {roleIcon(myRole)}
                    {myRole}
                  </span>
                </div>
                {workspace?.description && (
                  <p className="text-sm text-white/55 mt-2 max-w-lg leading-relaxed">
                    {workspace.description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/subscription/upgrade", { state: { from: "overview", workspaceId } })}
              className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all backdrop-blur-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Upgrade Plan
            </button>
          </div>

          {/* ── Stat pills inside the banner ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-xl p-4 bg-white/10 border border-white/15"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{s.label}</span>
                    <Icon className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <div className="text-3xl font-bold text-white leading-none">{s.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-none truncate">{a.label}</p>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{a.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Channels — 2/3 wide */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Recent Channels</p>
                  <p className="text-[11px] text-slate-400">Quick access to your active channels</p>
                </div>
              </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {channels.length} total
              </span>
            </div>

            <div className="divide-y divide-slate-50">
              {recentChannels.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                    <Hash className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No channels yet</p>
                  <p className="text-xs text-slate-400 mt-1">Create one to start collaborating</p>
                </div>
              ) : (
                recentChannels.map((ch) => (
                  <button
                    key={ch._id}
                    onClick={() => onSelectChannel(ch._id)}
                    className="group w-full flex items-center gap-4 px-5 py-3.5 hover:bg-indigo-50/50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Hash className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{ch.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{ch.type} channel</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ExternalLink className="w-3 h-3" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">

            {/* Boards */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Boards</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {boards.length}
                </span>
              </div>

              <div className="p-4">
                {boards.length === 0 ? (
                  <div className="py-5 text-center">
                    <p className="text-xs text-slate-400">No boards yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-4">
                    {boards.slice(0, 4).map((b) => (
                      <div key={b._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-50 transition-colors cursor-default group">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate">{b.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-violet-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                    {boards.length > 4 && (
                      <p className="text-xs text-slate-400 pl-3 pt-1">+{boards.length - 4} more boards</p>
                    )}
                  </div>
                )}
                <button
                  onClick={onOpenBoards}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  View All Boards
                </button>
              </div>
            </div>


          </div>
        </div>

        {/* ── Team Members ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Team Members</p>
                <p className="text-[11px] text-slate-400">People in this workspace</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
              {members.length} total
            </span>
          </div>

          <div className="p-5">
            {displayMembers.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No members yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {displayMembers.filter((m) => m.user).map((m, i) => (
                  <div
                    key={m._id}
                    className="relative flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
                  >
                    {/* Role accent stripe */}
                    <div className={`absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-full ${
                      m.role === "owner" ? "bg-amber-400" : m.role === "admin" ? "bg-indigo-400" : "bg-slate-200"
                    }`} />
                    {m.user.avatarUrl ? (
                      <img
                        src={m.user.avatarUrl}
                        alt={m.user.fullName}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${avatarHues[i % avatarHues.length]} flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm`}>
                        <span className="text-white text-xs font-bold">{getInitials(m.user.fullName)}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-slate-900 truncate">{m.user.fullName}</span>
                        {m.user._id === currentUserId && (
                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">you</span>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        m.role === "owner"
                          ? "bg-amber-100 text-amber-700"
                          : m.role === "admin"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-500"
                      }`}>
                        {m.role === "owner" ? <Crown className="w-2.5 h-2.5" /> : m.role === "admin" ? <Shield className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                        {m.role}
                      </span>
                    </div>
                  </div>
                ))}
                {extraMembers > 0 && (
                  <div className="flex items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-slate-200 text-xs font-semibold text-slate-400">
                    +{extraMembers} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Getting Started banner ── */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Getting started?</span> Create channels, set up boards, and invite your team to collaborate.
            </p>
          </div>
          <button
            onClick={onOpenBoards}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Open Boards <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 pb-2">
          Workspace created {createdDate || "recently"}
        </p>
      </div>
    </div>
  );
}

