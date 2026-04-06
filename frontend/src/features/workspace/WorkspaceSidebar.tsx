import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Hash,
  Plus,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Search,
  X,
  Lock,
  Loader2,
  Users,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import dmService from "../../services/dm.service";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace, getInitials } from "./WorkspaceContext";
import UserMenu from "../../users/UserMenu";
import CreateChannelModal from "../channels/CreateChannelModal";

interface WorkspaceSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sidebarWidth: number;
  onOpenCommandPalette?: () => void;
}

export default function WorkspaceSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarWidth,
  onOpenCommandPalette,
}: WorkspaceSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    workspaceId,
    workspace,
    workspaceLoading,
    channels,
    channelsLoading,
    members,
    membersLoading,
    sidebarBoards,
    boardsLoading,
    unreadChannelCounts,
    setUnreadChannelCounts,
    unreadDMCounts,
    setUnreadDMCounts,
    setDms,
    dmThreadByOtherUserId,
    onlineUsers,
  } = useWorkspace();

  const totalUnread =
    Object.values(unreadChannelCounts).reduce((a, b) => a + b, 0) +
    Object.values(unreadDMCounts).reduce((a, b) => a + b, 0);

  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const [isDMsExpanded, setIsDMsExpanded] = useState(true);
  const [isBoardsExpanded, setIsBoardsExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  // Remember scroll position per workspace
  const navScrollRef = useRef<HTMLDivElement>(null);
  const scrollKey = `sidebar-scroll-${workspaceId}`;

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem(scrollKey);
    if (saved) el.scrollTop = Number(saved);

    const onScroll = () => {
      sessionStorage.setItem(scrollKey, String(el.scrollTop));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollKey]);

  const basePath = `/workspaces/${workspaceId}`;
  const isOverview = location.pathname === basePath || location.pathname === `${basePath}/`;

  // Check if a given path is the current route
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-[#1a1d4d] shadow-2xl transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: sidebarWidth }}
      >
        <div className="h-full flex flex-col">
          {/* Workspace Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 hover:bg-white/10 rounded-lg p-2 -m-2 transition-all flex-1 min-w-0"
              >
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <span className="text-[#1a1d4d] font-bold">
                    {workspace?.name?.slice(0, 2).toUpperCase() || "CS"}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="font-bold text-white truncate">
                    {workspace?.name || "Workspace"}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <Users className="w-3 h-3" />
                    <span>
                      {workspaceLoading
                        ? "Loading..."
                        : `${members.length || workspace?.memberCount || 0} members`}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-white/60 shrink-0" />
              </button>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all ml-1"
              >
                <X className="w-5 h-5" />
              </button>

              {totalUnread > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnreadChannelCounts({});
                    setUnreadDMCounts({});
                  }}
                  title="Mark all as read"
                  className="hidden lg:flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/15 transition-colors ml-1 shrink-0"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>All read</span>
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <button
                onClick={onOpenCommandPalette}
                className="w-full pl-10 pr-14 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white/40 text-left hover:bg-white/15 transition-colors"
              >
                Search...
              </button>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 bg-white/10 px-1.5 py-0.5 rounded font-mono pointer-events-none">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Navigation Sections */}
          <div ref={navScrollRef} className="flex-1 overflow-y-auto">
            {/* Overview link */}
            <div className="px-2 pt-3 pb-1">
              <button
                onClick={() => {
                  navigate(basePath);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                  isOverview
                    ? "bg-indigo-600 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Overview</span>
              </button>
            </div>

            {/* Channels Section */}
            <div className="px-2 py-3 border-b border-white/10">
              <div
                onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-white/60 hover:bg-white/10 rounded-lg transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isChannelsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">Channels</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreateChannelOpen(true);
                  }}
                  className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded transition-all"
                  title="Create new channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isChannelsExpanded && (
                <div className="mt-1 space-y-0.5">
                  {channelsLoading ? (
                    <div className="px-3 py-2 text-white/60 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading channels...
                    </div>
                  ) : channels.length === 0 ? (
                    <div className="px-3 py-2 text-white/60 text-sm">
                      No channels yet
                    </div>
                  ) : (
                    channels.map((channel) => {
                      const channelPath = `${basePath}/channels/${channel._id}`;
                      return (
                        <button
                          key={channel._id}
                          onClick={() => {
                            navigate(channelPath);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all group ${
                            isActive(channelPath)
                              ? "bg-indigo-600 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {channel.type === "private" ? (
                              <Lock className="w-4 h-4 shrink-0" />
                            ) : (
                              <Hash className="w-4 h-4 shrink-0" />
                            )}
                            <span className="text-sm truncate">
                              {channel.name}
                            </span>
                          </div>
                          {Boolean(unreadChannelCounts[channel._id]) && (
                            <span className="ml-2 min-w-4.5 h-4 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
                              {unreadChannelCounts[channel._id]}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Direct Messages Section */}
            <div className="px-2 py-3 border-b border-white/10">
              <button
                onClick={() => setIsDMsExpanded(!isDMsExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-white/60 hover:bg-white/10 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-2">
                  {isDMsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">Direct Messages</span>
                </div>
              </button>

              {isDMsExpanded && (
                <div className="mt-1 space-y-0.5">
                  {membersLoading ? (
                    <div className="px-3 py-2 text-white/60 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading members...
                    </div>
                  ) : members.length === 0 ? (
                    <div className="px-3 py-2 text-white/60 text-sm">
                      No members yet
                    </div>
                  ) : (
                    [...members]
                      .sort((a, b) => {
                        const aIsSelf = a.user?._id === user?.id ? 0 : 1;
                        const bIsSelf = b.user?._id === user?.id ? 0 : 1;
                        return aIsSelf - bIsSelf;
                      })
                      .map((member) => {
                        const isSelf = member.user?._id === user?.id;
                        const name = member.user?.fullName || "User";
                        const initials = getInitials(name);
                        const existingDM = member.user?._id
                          ? dmThreadByOtherUserId.get(String(member.user._id))
                          : undefined;
                        const dmPath = existingDM
                          ? `${basePath}/dms/${existingDM._id}`
                          : null;
                        const isSelected = dmPath ? isActive(dmPath) : false;
                        const unreadForThisDM = existingDM?._id
                          ? unreadDMCounts[existingDM._id] || 0
                          : 0;

                        return (
                          <button
                            key={member._id}
                            onClick={async () => {
                              if (!workspaceId || !member.user?._id) return;
                              // Navigate directly if we already have the thread
                              if (existingDM) {
                                navigate(`${basePath}/dms/${existingDM._id}`);
                                setIsSidebarOpen(false);
                                return;
                              }
                              try {
                                const dmThread = await dmService.openOrCreate(
                                  workspaceId,
                                  member.user._id,
                                );
                                const enrichedDM = {
                                  ...dmThread,
                                  otherUser: {
                                    _id: member.user._id,
                                    name: member.user.fullName || "User",
                                    email: member.user.email,
                                    avatarUrl: member.user.avatarUrl,
                                  },
                                };
                                setDms((prev) => {
                                  const exists = prev.some(
                                    (d) => d._id === enrichedDM._id,
                                  );
                                  return exists ? prev : [...prev, enrichedDM];
                                });
                                navigate(`${basePath}/dms/${enrichedDM._id}`);
                                setIsSidebarOpen(false);
                              } catch (err: any) {
                                toast.error(
                                  err?.response?.data?.message ||
                                    "Failed to open DM",
                                );
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div
                                className={`w-6 h-6 bg-linear-to-br ${isSelf ? "from-amber-400 to-orange-400" : "from-indigo-400 to-purple-400"} rounded-full flex items-center justify-center text-white text-[9px] font-bold`}
                              >
                                {initials}
                              </div>
                              {!isSelf && member.user?._id && onlineUsers.has(member.user._id) && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-[#1a1d4d] rounded-full" />
                              )}
                            </div>
                            <span className="text-sm flex-1 truncate text-left">
                              {isSelf ? `${name} (you)` : name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {!isSelf && unreadForThisDM > 0 && (
                                <span className="min-w-4.5 h-4 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
                                  {unreadForThisDM}
                                </span>
                              )}
                              <span className="text-[10px] text-white/40 capitalize">
                                {member.role}
                              </span>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              )}
            </div>

            {/* Boards Section */}
            <div className="px-2 py-3">
              <div
                onClick={() => setIsBoardsExpanded(!isBoardsExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-white/60 hover:bg-white/10 rounded-lg transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isBoardsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">Boards</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`${basePath}/boards`);
                    setIsSidebarOpen(false);
                  }}
                  className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded transition-all"
                  title="Create new board"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isBoardsExpanded && (
                <div className="mt-2 space-y-1.5 px-1">
                  {boardsLoading ? (
                    <div className="px-3 py-2 text-white/60 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading boards...
                    </div>
                  ) : sidebarBoards.length === 0 ? (
                    <button
                      onClick={() => {
                        navigate(`${basePath}/boards`);
                        setIsSidebarOpen(false);
                      }}
                      className="w-full flex flex-col items-center gap-1.5 py-4 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/30 hover:bg-white/5 transition-all"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="text-xs font-medium">
                        Create your first board
                      </span>
                    </button>
                  ) : (
                    <>
                      {sidebarBoards.map((board) => {
                        const boardPath = `${basePath}/boards/${board._id}`;
                        const boardActive = isActive(boardPath);
                        return (
                          <button
                            key={board._id}
                            onClick={() => {
                              navigate(boardPath);
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                              boardActive
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                boardActive
                                  ? "bg-white/20"
                                  : "bg-linear-to-br from-indigo-500/30 to-purple-500/30"
                              }`}
                            >
                              <LayoutDashboard className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium truncate">
                              {board.name}
                            </span>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          navigate(`${basePath}/boards`);
                          setIsSidebarOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <LayoutDashboard className="w-3 h-3" />
                        View all boards
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 relative">
            {userMenuOpen && (
              <UserMenu
                fullName={user?.fullName || "User"}
                email={user?.email || ""}
                avatarUrl={user?.avatarUrl}
                onProfile={() => {
                  setUserMenuOpen(false);
                  navigate(`${basePath}/profile`);
                }}
                onPreferences={() => {
                  setUserMenuOpen(false);
                  navigate(`${basePath}/preferences`);
                }}
                onSignOut={() => {
                  setUserMenuOpen(false);
                  toast.success("Logged out successfully");
                  navigate("/login");
                }}
                onClose={() => setUserMenuOpen(false)}
              />
            )}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user?.fullName || "U")}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-white text-sm truncate">
                  {user?.fullName || "You"}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Create Channel Modal */}
      {isCreateChannelOpen && (
        <CreateChannelModal onClose={() => setIsCreateChannelOpen(false)} />
      )}
    </>
  );
}
