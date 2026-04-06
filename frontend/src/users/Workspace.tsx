import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Hash,
  Plus,
  ChevronDown,
  ChevronRight,
  Send,
  LayoutDashboard,
  Search,
  Settings,
  Bell,
  Menu,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  Lock,
  Globe,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Video,
  Phone,
  Loader2,
  Users,
  FileText,
  Download,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CallModal } from "../components/ui/CallModal";
import { useAuth } from "../hooks/useAuth";
import { useWebRTCCall } from "../hooks/useWebRTCCall";

import workspaceService from "../services/workspace.service";
import channelService from "../services/channel.service";
import dmService from "../services/dm.service";
import messageService from "../services/message.service";
import workspaceMemberService from "../services/workspaceMember.service";
import boardService from "../services/board.service";
import {
  getSocket,
  EVENTS,
} from "../services/socket.service";
import WorkspaceSettings from "./WorkspaceSettings";
import UserMenu from "./UserMenu";
import UserProfile from "./UserProfile";
import UserPreferences from "./UserPreferences";
import Notifications from "./Notifications";
import KanbanBoard from "./KanbanBoard";
import WorkspaceOverview from "./WorkspaceOverview";

import type { Workspace as WorkspaceT } from "../services/workspace.service";
import type { Channel } from "../services/channel.service";
import type { DMThread } from "../services/dm.service";
import type { Message } from "../services/message.service";
import type { WorkspaceMember } from "../services/workspaceMember.service";
import type { Board } from "../services/board.service";

type ActiveView = "channel" | "dm";

/** Return up to 2 uppercase initials from a name string. */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/**
 * API-driven Workspace page:
 * - Loads workspace details (optional), channels, and DM threads from backend
 * - Selects default channel automatically
 * - Loads messages for selected conversation (channel/dm)
 * - Sends messages via backend
 * - Creates channels via backend
 *
 * Assumed endpoints:
 *  GET  /workspaces/:workspaceId              (optional)
 *  GET  /workspaces/:workspaceId/channels
 *  POST /workspaces/:workspaceId/channels
 *  GET  /workspaces/:workspaceId/dms
 *  GET  /workspaces/:workspaceId/messages?type=channel|dm&refId=<id>
 *  POST /workspaces/:workspaceId/messages
 */
export default function Workspace() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { user } = useAuth();

  const call = useWebRTCCall();

  // Workspace
  const [workspace, setWorkspace] = useState<WorkspaceT | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Sidebar UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Resizable sidebar
  const SIDEBAR_MIN = 220;
  const SIDEBAR_MAX = 480;
  const SIDEBAR_DEFAULT = 256;
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-width");
      if (saved) {
        const w = Number(saved);
        if (w >= SIDEBAR_MIN && w <= SIDEBAR_MAX) return w;
      }
    } catch {}
    return SIDEBAR_DEFAULT;
  });
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, ev.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setSidebarWidth((w) => {
        try {
          localStorage.setItem("sidebar-width", String(w));
        } catch {}
        return w;
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const [isDMsExpanded, setIsDMsExpanded] = useState(true);
  const [isBoardsExpanded, setIsBoardsExpanded] = useState(true);

  // Data
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<DMThread[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const generalCreatedRef = useRef(false);

  // Boards
  const [sidebarBoards, setSidebarBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [boardsViewKey, setBoardsViewKey] = useState(0);

  // Conversation selection
  const [activeView, setActiveView] = useState<ActiveView>("channel");
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null); // channelId or dmId

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Composer
  const [messageInput, setMessageInput] = useState("");

  // Auto-scroll to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reaction popup
  const [reactionMenuId, setReactionMenuId] = useState<string | null>(null);

  // Edit / Delete message
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // File & image attachments
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Create channel modal
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isChannelInviteOpen, setIsChannelInviteOpen] = useState(false);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [isInvitingMembers, setIsInvitingMembers] = useState(false);
  const [channelNameDraft, setChannelNameDraft] = useState("");
  const [isSavingChannelName, setIsSavingChannelName] = useState(false);
  const [removingChannelMemberId, setRemovingChannelMemberId] = useState<
    string | null
  >(null);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);
  const [deleteChannelConfirmName, setDeleteChannelConfirmName] = useState("");

  // Create board — delegate to KanbanBoard
  const [sidebarCreateBoard, setSidebarCreateBoard] = useState(false);

  // Unread message counts
  const [unreadChannelCounts, setUnreadChannelCounts] = useState<
    Record<string, number>
  >({});
  const [unreadDMCounts, setUnreadDMCounts] = useState<Record<string, number>>(
    {},
  );
  const countedMessageIdsRef = useRef<Set<string>>(new Set());

  // Settings panel
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User menu / panel
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userPanel, setUserPanel] = useState<
    "overview" | "profile" | "preferences" | "notifications" | "boards" | null
  >("overview");

  const selectedChannel = useMemo(
    () => channels.find((c) => c._id === selectedRefId) || null,
    [channels, selectedRefId],
  );

  const selectedDM = useMemo(
    () => dms.find((d) => d._id === selectedRefId) || null,
    [dms, selectedRefId],
  );

  const isSelfDM = useMemo(() => {
    if (!selectedDM?.participants || !user?.id) return false;
    return (
      (selectedDM.participants.length === 1 &&
        selectedDM.participants[0] === user.id) ||
      (selectedDM.participants.length === 2 &&
        selectedDM.participants.every((p: string) => p === user.id)) ||
      selectedDM.otherUser?._id === user.id
    );
  }, [selectedDM, user]);

  const selectedDMPeerUserId = useMemo(() => {
    if (activeView !== "dm" || !selectedDM || !user?.id) return null;
    if (isSelfDM) return null;
    return (
      selectedDM.otherUser?._id ||
      selectedDM.participants?.find((p: string) => p !== user.id) ||
      null
    );
  }, [activeView, isSelfDM, selectedDM, user?.id]);

  const callPeerName = useMemo(() => {
    if (!call.peerUserId) return "User";
    const member = members.find((m) => m.user?._id === call.peerUserId);
    if (member?.user?.fullName) return member.user.fullName;
    if (selectedDM?.otherUser?._id === call.peerUserId)
      return selectedDM.otherUser?.name || "User";
    return "User";
  }, [call.peerUserId, members, selectedDM?.otherUser?._id, selectedDM?.otherUser?.name]);

  const callPeerInitials = useMemo(() => getInitials(callPeerName), [callPeerName]);

  const handleHangup = useCallback(() => {
    if (call.status === "incoming") {
      call.rejectCall("declined");
      return;
    }
    call.endCall("hangup");
  }, [call]);

  const conversationTitle = useMemo(() => {
    if (activeView === "channel") return selectedChannel?.name ?? "Channel";
    if (isSelfDM) return "You (Notes)";
    if (selectedDM?.otherUser?.name) return selectedDM.otherUser.name;
    if (selectedDM?.participants) {
      const otherId = selectedDM.participants.find(
        (p: string) => p !== user?.id,
      );
      const otherMember = members.find((m) => m.user?._id === otherId);
      if (otherMember?.user?.fullName) return otherMember.user.fullName;
    }
    return "Direct Message";
  }, [activeView, selectedChannel, selectedDM, members, user, isSelfDM]);

  const myWorkspaceRole = useMemo(() => {
    const currentMember = members.find(
      (member) => member.user?._id === user?.id,
    );
    return currentMember?.role || null;
  }, [members, user]);

  const unreadStorageKey = useMemo(() => {
    if (!workspaceId || !user?.id) return null;
    return `unreadCounts:${workspaceId}:${user.id}`;
  }, [workspaceId, user?.id]);

  useEffect(() => {
    if (!unreadStorageKey) return;
    try {
      const raw = localStorage.getItem(unreadStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        channels?: Record<string, number>;
        dms?: Record<string, number>;
      };
      if (parsed.channels) setUnreadChannelCounts(parsed.channels);
      if (parsed.dms) setUnreadDMCounts(parsed.dms);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadStorageKey]);

  useEffect(() => {
    if (!unreadStorageKey) return;
    try {
      localStorage.setItem(
        unreadStorageKey,
        JSON.stringify({ channels: unreadChannelCounts, dms: unreadDMCounts }),
      );
    } catch {
      // ignore
    }
  }, [unreadStorageKey, unreadChannelCounts, unreadDMCounts]);

  const canCreatePrivateChannel =
    myWorkspaceRole === "owner" || myWorkspaceRole === "admin";
  const isWorkspaceOwner = myWorkspaceRole === "owner";

  const canManagePrivateChannelInvites = canCreatePrivateChannel;

  const canRenameSelectedChannel = useMemo(() => {
    if (!selectedChannel) return false;
    if (selectedChannel.type === "private")
      return canManagePrivateChannelInvites;
    return canCreatePrivateChannel;
  }, [
    selectedChannel,
    canManagePrivateChannelInvites,
    canCreatePrivateChannel,
  ]);

  const inviteableChannelMembers = useMemo(() => {
    if (!selectedChannel || selectedChannel.type !== "private") return [];

    const currentMembers = new Set(selectedChannel.members || []);
    return members.filter(
      (member) =>
        Boolean(member.user?._id) &&
        !currentMembers.has(String(member.user._id)),
    );
  }, [members, selectedChannel]);

  const currentPrivateChannelMembers = useMemo(() => {
    if (!selectedChannel || selectedChannel.type !== "private") return [];

    const currentMembers = new Set((selectedChannel.members || []).map(String));
    return members.filter((member) =>
      currentMembers.has(String(member.user._id)),
    );
  }, [members, selectedChannel]);

  const dmThreadByOtherUserId = useMemo(() => {
    const map = new Map<string, DMThread>();
    const me = user?.id;
    for (const dm of dms) {
      const otherId =
        dm.otherUser?._id ||
        (me && dm.participants
          ? dm.participants.find((p) => p !== me)
          : undefined);
      if (otherId) map.set(String(otherId), dm);
    }
    return map;
  }, [dms, user?.id]);

  // Helpers
  const selectChannel = (channelId: string) => {
    setActiveView("channel");
    setSelectedRefId(channelId);
    setUserPanel(null);
    setIsSidebarOpen(false);
  };

  // Reset per-workspace refs when the workspace changes to avoid stale state
  useEffect(() => {
    generalCreatedRef.current = false;
    countedMessageIdsRef.current.clear();
  }, [workspaceId]);

  // Load workspace details, channels, dms, and members
  useEffect(() => {
    if (!workspaceId) return;

    (async () => {
      try {
        // Load workspace details
        setWorkspaceLoading(true);
        try {
          const ws = await workspaceService.getById(workspaceId);
          if (ws) setWorkspace(ws);
        } catch {
          // fallback: workspace detail fetch failed
        } finally {
          setWorkspaceLoading(false);
        }

        setChannelsLoading(true);
        setMembersLoading(true);
        setBoardsLoading(true);

        const [ch, dm, membersList, boardsList] = await Promise.all([
          channelService.list(workspaceId),
          dmService.list(workspaceId),
          workspaceMemberService.list(workspaceId).catch(() => []),
          boardService.listBoards(workspaceId).catch(() => [] as Board[]),
        ]);

        setDms(dm);
        setMembers(membersList);
        setSidebarBoards(boardsList);
        setBoardsLoading(false);

        // Auto-create #general channel if it doesn't exist
        let finalChannels = ch;
        const hasGeneral = ch.some((c) => c.name.toLowerCase() === "general");

        if (!hasGeneral && !generalCreatedRef.current) {
          generalCreatedRef.current = true;
          try {
            const generalChannel = await channelService.create(workspaceId, {
              name: "general",
              type: "public",
            });
            finalChannels = [generalChannel, ...ch];
          } catch {
            // #general creation failed (maybe another user already created it)
            finalChannels = ch;
          }
        }

        setChannels(finalChannels);

        // Show workspace overview by default — don't auto-select a channel
        // Keep references ready but show the overview panel
        setUserPanel("overview");
        setSelectedRefId(null);
        setMessages([]);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load workspace");
      } finally {
        setChannelsLoading(false);
        setMembersLoading(false);
      }
    })();
  }, [workspaceId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedRefId) return;

    (async () => {
      try {
        setMessagesLoading(true);
        const msgs =
          activeView === "channel"
            ? await messageService.listByChannel(selectedRefId)
            : await messageService.listByDM(selectedRefId);
        // Backend returns newest-first; reverse for chronological chat order
        setMessages(msgs.reverse());
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load messages");
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    })();
  }, [activeView, selectedRefId]);

  // Clear unread count when opening a conversation
  useEffect(() => {
    if (!selectedRefId) return;

    if (activeView === "channel") {
      setUnreadChannelCounts((prev) => {
        if (!prev[selectedRefId]) return prev;
        const next = { ...prev };
        delete next[selectedRefId];
        return next;
      });
    }

    if (activeView === "dm") {
      setUnreadDMCounts((prev) => {
        if (!prev[selectedRefId]) return prev;
        const next = { ...prev };
        delete next[selectedRefId];
        return next;
      });
    }
  }, [activeView, selectedRefId]);

  // ─── Socket.IO: connect, join rooms, listen for real-time messages ───
  useEffect(() => {
    const socket = getSocket();

    // Join all channel rooms the user is in
    channels.forEach((ch) => socket.emit(EVENTS.CHANNEL_JOIN, ch._id));
    // Join all DM rooms
    dms.forEach((dm) => socket.emit(EVENTS.DM_JOIN, dm._id));

    // --- Channel events ---
    const onChannelNew = (msg: Message) => {
      const channelId = String((msg as any).channel || "");
      if (!channelId) return;

      const isViewing = activeView === "channel" && selectedRefId === channelId;
      const isOwn = Boolean(
        msg.sender?._id && user?.id && msg.sender._id === user.id,
      );

      // Always append when currently viewing this conversation
      if (isViewing) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      // Count as unread only if not viewing and not your own message
      if (!isViewing && !isOwn) {
        if (countedMessageIdsRef.current.has(msg._id)) return;
        countedMessageIdsRef.current.add(msg._id);
        setUnreadChannelCounts((prev) => ({
          ...prev,
          [channelId]: (prev[channelId] || 0) + 1,
        }));
      }
    };
    const onChannelEdited = (msg: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };
    const onChannelDeleted = ({ _id }: { _id: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === _id
            ? { ...m, deletedAt: new Date().toISOString(), content: "" }
            : m,
        ),
      );
    };
    const onChannelReacted = (msg: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    // --- DM events ---
    const onDMNew = (msg: Message) => {
      const dmId = String((msg as any).dm || "");
      if (!dmId) return;

      const isViewing = activeView === "dm" && selectedRefId === dmId;
      const isOwn = Boolean(
        msg.sender?._id && user?.id && msg.sender._id === user.id,
      );

      if (isViewing) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      if (!isViewing && !isOwn) {
        if (countedMessageIdsRef.current.has(msg._id)) return;
        countedMessageIdsRef.current.add(msg._id);
        setUnreadDMCounts((prev) => ({
          ...prev,
          [dmId]: (prev[dmId] || 0) + 1,
        }));
      }
    };
    const onDMEdited = (msg: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };
    const onDMDeleted = ({ _id }: { _id: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === _id
            ? { ...m, deletedAt: new Date().toISOString(), content: "" }
            : m,
        ),
      );
    };
    const onDMReacted = (msg: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    socket.on(EVENTS.CHANNEL_MESSAGE_NEW, onChannelNew);
    socket.on(EVENTS.CHANNEL_MESSAGE_EDITED, onChannelEdited);
    socket.on(EVENTS.CHANNEL_MESSAGE_DELETED, onChannelDeleted);
    socket.on(EVENTS.CHANNEL_MESSAGE_REACTED, onChannelReacted);
    socket.on(EVENTS.DM_MESSAGE_NEW, onDMNew);
    socket.on(EVENTS.DM_MESSAGE_EDITED, onDMEdited);
    socket.on(EVENTS.DM_MESSAGE_DELETED, onDMDeleted);
    socket.on(EVENTS.DM_MESSAGE_REACTED, onDMReacted);

    return () => {
      // Leave rooms
      channels.forEach((ch) => socket.emit(EVENTS.CHANNEL_LEAVE, ch._id));
      dms.forEach((dm) => socket.emit(EVENTS.DM_LEAVE, dm._id));
      // Remove listeners
      socket.off(EVENTS.CHANNEL_MESSAGE_NEW, onChannelNew);
      socket.off(EVENTS.CHANNEL_MESSAGE_EDITED, onChannelEdited);
      socket.off(EVENTS.CHANNEL_MESSAGE_DELETED, onChannelDeleted);
      socket.off(EVENTS.CHANNEL_MESSAGE_REACTED, onChannelReacted);
      socket.off(EVENTS.DM_MESSAGE_NEW, onDMNew);
      socket.off(EVENTS.DM_MESSAGE_EDITED, onDMEdited);
      socket.off(EVENTS.DM_MESSAGE_DELETED, onDMDeleted);
      socket.off(EVENTS.DM_MESSAGE_REACTED, onDMReacted);
    };
  }, [channels, dms, activeView, selectedRefId, user?.id]);

  // Join workspace socket room so we receive structural live-update events
  useEffect(() => {
    if (!workspaceId) return;
    const socket = getSocket();
    socket.emit(EVENTS.WORKSPACE_JOIN, workspaceId);
    return () => {
      socket.emit(EVENTS.WORKSPACE_LEAVE, workspaceId);
    };
  }, [workspaceId]);

  // ─── Workspace structural socket events ──────────────────────────────────
  // Refs keep the closures up-to-date without triggering re-registration on
  // every channel/board selection, preventing the listener churn race condition.
  const selectedRefIdRef = useRef(selectedRefId);
  const selectedBoardIdRef = useRef(selectedBoardId);
  useEffect(() => { selectedRefIdRef.current = selectedRefId; }, [selectedRefId]);
  useEffect(() => { selectedBoardIdRef.current = selectedBoardId; }, [selectedBoardId]);

  useEffect(() => {
    if (!workspaceId) return;
    const socket = getSocket();

    // ── Channels ──
    const onChannelCreated = (channel: Channel) => {
      setChannels((prev) =>
        prev.some((c) => c._id === channel._id) ? prev : [channel, ...prev],
      );
    };
    const onChannelDeleted = ({ _id }: { _id: string }) => {
      setChannels((prev) => prev.filter((c) => c._id !== _id));
      if (selectedRefIdRef.current === _id) {
        setSelectedRefId(null);
        setMessages([]);
        setUserPanel("overview");
      }
    };
    const onChannelUpdated = (updated: Channel) => {
      setChannels((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
    };

    // ── Members ──
    const onMemberRemoved = ({ memberId, userId: removedUserId }: { memberId: string; userId: string }) => {
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      // If the current user was removed, kick them to selector
      if (removedUserId === user?.id) {
        toast.error("You have been removed from this workspace.");
        navigate("/selector");
      }
    };
    const onMemberRoleChanged = (updated: WorkspaceMember) => {
      setMembers((prev) =>
        prev.map((m) => (m._id === updated._id ? { ...m, role: updated.role } : m)),
      );
    };

    // ── Boards ──
    const onBoardCreated = (board: Board) => {
      setSidebarBoards((prev) =>
        prev.some((b) => b._id === board._id) ? prev : [board, ...prev],
      );
    };
    const onBoardDeleted = ({ boardId }: { boardId: string }) => {
      setSidebarBoards((prev) => prev.filter((b) => b._id !== boardId));
      if (selectedBoardIdRef.current === boardId) {
        setSelectedBoardId(null);
        setUserPanel("overview");
      }
    };
    const onBoardUpdated = (updated: Board) => {
      setSidebarBoards((prev) =>
        prev.map((b) => (b._id === updated._id ? updated : b)),
      );
    };

    socket.on(EVENTS.CHANNEL_CREATED, onChannelCreated);
    socket.on(EVENTS.CHANNEL_DELETED, onChannelDeleted);
    socket.on(EVENTS.CHANNEL_UPDATED, onChannelUpdated);
    socket.on(EVENTS.WORKSPACE_MEMBER_REMOVED, onMemberRemoved);
    socket.on(EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, onMemberRoleChanged);
    socket.on(EVENTS.BOARD_CREATED, onBoardCreated);
    socket.on(EVENTS.BOARD_DELETED, onBoardDeleted);
    socket.on(EVENTS.BOARD_UPDATED, onBoardUpdated);

    return () => {
      socket.off(EVENTS.CHANNEL_CREATED, onChannelCreated);
      socket.off(EVENTS.CHANNEL_DELETED, onChannelDeleted);
      socket.off(EVENTS.CHANNEL_UPDATED, onChannelUpdated);
      socket.off(EVENTS.WORKSPACE_MEMBER_REMOVED, onMemberRemoved);
      socket.off(EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, onMemberRoleChanged);
      socket.off(EVENTS.BOARD_CREATED, onBoardCreated);
      socket.off(EVENTS.BOARD_DELETED, onBoardDeleted);
      socket.off(EVENTS.BOARD_UPDATED, onBoardUpdated);
    };
  }, [workspaceId, user?.id, navigate]);

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if ((!content && !pendingFile) || !selectedRefId) return;

    setMessageInput("");
    const file = pendingFile;
    setPendingFile(null);
    try {
      const sent =
        activeView === "channel"
          ? await messageService.sendToChannel(
              selectedRefId,
              content || "",
              file || undefined,
            )
          : await messageService.sendToDM(
              selectedRefId,
              content || "",
              file || undefined,
            );

      // Append immediately for instant UX (socket may arrive later)
      setMessages((prev) => {
        if (prev.some((m) => m._id === sent._id)) return prev;
        return [...prev, sent];
      });
    } catch (err: any) {
      console.error("Send message error:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send message",
      );
    }
  };

  const handleCreateChannel = async () => {
    if (!workspaceId) return;

    const name = newChannelName.trim();
    if (!name) {
      toast.error("Please enter a channel name");
      return;
    }

    setIsCreatingChannel(true);
    try {
      const created = await channelService.create(workspaceId, {
        name,
        type: newChannelPrivate ? "private" : "public",
      });

      toast.success(`Channel #${created.name} created successfully!`);
      // Don't add to state here — the socket CHANNEL_CREATED event will add it
      // for all members (including the creator) to avoid duplicates.

      setIsCreateChannelOpen(false);
      setNewChannelName("");
      setNewChannelPrivate(false);

      setActiveView("channel");
      setSelectedRefId(created._id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const toggleInvitee = (userId: string) => {
    setSelectedInviteeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleInviteChannelMembers = async () => {
    if (!selectedChannel?._id || selectedInviteeIds.length === 0) return;

    setIsInvitingMembers(true);
    try {
      const updatedChannel = await channelService.addMembers(
        selectedChannel._id,
        selectedInviteeIds,
      );

      setChannels((prev) =>
        prev.map((channel) =>
          channel._id === updatedChannel._id ? updatedChannel : channel,
        ),
      );
      setSelectedInviteeIds([]);
      toast.success("Members invited to the private channel");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to invite members to channel",
      );
    } finally {
      setIsInvitingMembers(false);
    }
  };

  const openChannelSettingsModal = () => {
    setSelectedInviteeIds([]);
    setChannelNameDraft(selectedChannel?.name || "");
    setDeleteChannelConfirmName("");
    setIsChannelInviteOpen(true);
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannel?._id) return;
    if (deleteChannelConfirmName.trim() !== selectedChannel.name) {
      toast.error("Please type the exact channel name to confirm deletion");
      return;
    }

    setIsDeletingChannel(true);
    try {
      const deleted = await channelService.remove(selectedChannel._id);

      setChannels((prev) =>
        prev.filter((channel) => channel._id !== deleted._id),
      );

      if (selectedRefId === deleted._id) {
        setSelectedRefId(null);
        setMessages([]);
        setUserPanel("overview");
      }

      setIsChannelInviteOpen(false);
      toast.success("Channel deleted successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete channel");
    } finally {
      setIsDeletingChannel(false);
    }
  };

  const handleRenameChannel = async () => {
    if (!selectedChannel?._id) return;

    const nextName = channelNameDraft.trim().toLowerCase().replace(/\s+/g, "-");
    if (!nextName) {
      toast.error("Please enter a channel name");
      return;
    }
    if (nextName === selectedChannel.name) return;

    setIsSavingChannelName(true);
    try {
      const updatedChannel = await channelService.update(selectedChannel._id, {
        name: nextName,
      });

      setChannels((prev) =>
        prev.map((channel) =>
          channel._id === updatedChannel._id ? updatedChannel : channel,
        ),
      );
      setChannelNameDraft(updatedChannel.name);
      toast.success("Channel renamed successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to rename channel");
    } finally {
      setIsSavingChannelName(false);
    }
  };

  const handleRemoveChannelMember = async (memberId: string) => {
    if (!selectedChannel?._id) return;

    setRemovingChannelMemberId(memberId);
    try {
      const updatedChannel = await channelService.removeMember(
        selectedChannel._id,
        memberId,
      );

      setChannels((prev) =>
        prev.map((channel) =>
          channel._id === updatedChannel._id ? updatedChannel : channel,
        ),
      );
      toast.success("Member removed from channel");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to remove member from channel",
      );
    } finally {
      setRemovingChannelMemberId(null);
    }
  };

  const openSettings = () => setIsSettingsOpen(true);

  const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"];

  const handleEditMessage = async (messageId: string) => {
    const content = editInput.trim();
    if (!content) return;
    try {
      await messageService.edit(messageId, content);
      // Socket event will update the message in state
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to edit message");
    } finally {
      setEditingMessageId(null);
      setEditInput("");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageService.remove(messageId);
      // Socket event will mark the message as deleted in state
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete message");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const updated = await messageService.react(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, reactions: updated.reactions } : m,
        ),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to react");
    } finally {
      setReactionMenuId(null);
    }
  };

  const renderChatHeader = () => {
    if (activeView === "channel" && selectedChannel) {
      return (
        <>
          <div className="w-10 h-10 bg-linear-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
            {selectedChannel.type === "private" ? (
              <Lock className="w-5 h-5 text-indigo-600" />
            ) : (
              <Hash className="w-5 h-5 text-indigo-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {selectedChannel.name}
              {selectedChannel.type === "private" && (
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                  Private
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Channel
            </p>
          </div>
        </>
      );
    }

    if (activeView === "dm" && selectedDM) {
      if (isSelfDM) {
        // Self-DM (notes to self)
        const myMember = members.find((m) => m.user?._id === user?.id);
        const myName = myMember?.user?.fullName || "You";
        const initials = getInitials(myName);
        return (
          <>
            <div className="relative">
              <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-100 dark:bg-amber-900/60 rounded-full flex items-center justify-center">
                <span className="text-[8px]">📝</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {myName}{" "}
                <span className="text-base font-medium text-slate-400">
                  (you)
                </span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Draft messages &amp; notes
              </p>
            </div>
          </>
        );
      }

      // Try otherUser first (enriched on click), fall back to matching from members via participants
      let name = selectedDM.otherUser?.name || "";
      if (!name && selectedDM.participants) {
        const otherId = selectedDM.participants.find(
          (p: string) => p !== user?.id,
        );
        const otherMember = members.find((m) => m.user?._id === otherId);
        name = otherMember?.user?.fullName || "";
      }
      if (!name) {
        // Last resort: look through messages for a sender that isn't the current user
        const otherMsg = messages.find((msg) => msg.sender?._id !== user?.id);
        name = otherMsg?.sender?.fullName || "User";
      }
      const initials = getInitials(name);
      return (
        <>
          <div className="relative">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            {selectedDM.otherUser?.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {selectedDM.otherUser?.online ? "Active now" : "Offline"}
            </p>
          </div>
        </>
      );
    }

    // fallback
    return (
      <>
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Hash className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {conversationTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Conversation
          </p>
        </div>
      </>
    );
  };

  const renderMessages = () => {
    if (!selectedRefId) {
      return (
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="text-center max-w-md">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              No conversation selected
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Create a channel or open a direct message to start chatting.
            </p>
          </div>
        </div>
      );
    }

    if (messagesLoading) {
      return (
        <div className="flex-1 flex items-center justify-center py-12 text-slate-600 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading messages...
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Start the conversation
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Send the first message in{" "}
              <span className="font-semibold">
                {activeView === "channel"
                  ? `#${selectedChannel?.name || "channel"}`
                  : isSelfDM
                    ? "your notes"
                    : selectedDM?.otherUser?.name || "DM"}
              </span>
              .
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
        {messages.map((m, msgIdx) => {
          const senderName = m.sender?.fullName || "Unknown";
          const avatar = getInitials(senderName);
          const isMine = m.sender?._id === user?.id;
          const time = m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          // Group reactions by emoji
          const reactionCounts: Record<
            string,
            { count: number; userReacted: boolean; names: string[] }
          > = {};
          (m.reactions || []).forEach((r) => {
            if (!reactionCounts[r.emoji])
              reactionCounts[r.emoji] = {
                count: 0,
                userReacted: false,
                names: [],
              };
            reactionCounts[r.emoji].count++;
            if (r.user === user?.id) {
              reactionCounts[r.emoji].userReacted = true;
              reactionCounts[r.emoji].names.push("You");
            } else {
              const member = members.find((mem) => mem.user?._id === r.user);
              reactionCounts[r.emoji].names.push(
                member?.user?.fullName || "Someone",
              );
            }
          });

          return (
            <div
              key={m._id}
              className={`flex gap-3 group relative ${isMine ? "flex-row-reverse" : ""}`}
            >
              {/* Deleted message placeholder */}
              {m.deletedAt ? (
                <>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 opacity-40 ${
                      isMine
                        ? "bg-linear-to-br from-indigo-600 to-violet-600"
                        : "bg-linear-to-br from-indigo-500 to-purple-600"
                    }`}
                  >
                    {avatar}
                  </div>
                  <div
                    className={`max-w-[70%] min-w-0 ${isMine ? "text-right" : ""}`}
                  >
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${
                        isMine ? "justify-end" : ""
                      }`}
                    >
                      {isMine ? (
                        <>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {time}
                          </span>
                          <span className="font-semibold text-slate-400 dark:text-slate-500 text-sm">
                            {senderName}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-400 dark:text-slate-500 text-sm">
                            {senderName}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {time}
                          </span>
                        </>
                      )}
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm border border-dashed ${
                        isMine
                          ? "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 rounded-br-md"
                          : "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 rounded-bl-md"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      This message was deleted
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                      isMine
                        ? "bg-linear-to-br from-indigo-600 to-violet-600"
                        : "bg-linear-to-br from-indigo-500 to-purple-600"
                    }`}
                  >
                    {avatar}
                  </div>
                  <div
                    className={`max-w-[70%] min-w-0 ${isMine ? "text-right" : ""}`}
                  >
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${
                        isMine ? "justify-end" : ""
                      }`}
                    >
                      {isMine ? (
                        <>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {time}
                          </span>
                          {m.editedAt && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              (edited)
                            </span>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {senderName}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {senderName}
                          </span>
                          {m.editedAt && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              (edited)
                            </span>
                          )}
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {time}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="relative inline-block">
                      {/* Inline edit mode */}
                      {editingMessageId === m._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editInput}
                            onChange={(e) => setEditInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditMessage(m._id);
                              if (e.key === "Escape") {
                                setEditingMessageId(null);
                                setEditInput("");
                              }
                            }}
                            autoFocus
                            className="px-3 py-2 rounded-xl text-sm border border-indigo-300 dark:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-50"
                          />
                          <button
                            onClick={() => handleEditMessage(m._id)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditInput("");
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                              isMine
                                ? "bg-indigo-600 text-white rounded-br-md"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md"
                            }`}
                          >
                            {m.content}
                            {/* Render attachments */}
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {m.attachments.map((att, idx) => {
                                  const isImage =
                                    att.mimeType?.startsWith("image/");
                                  if (isImage) {
                                    return (
                                      <img
                                        key={idx}
                                        src={`data:${att.mimeType};base64,${att.dataBase64}`}
                                        alt={att.fileName}
                                        className="max-w-full max-h-60 rounded-lg cursor-pointer"
                                        onClick={() =>
                                          window.open(
                                            `data:${att.mimeType};base64,${att.dataBase64}`,
                                            "_blank",
                                          )
                                        }
                                      />
                                    );
                                  }
                                  return (
                                    <a
                                      key={idx}
                                      href={`data:${att.mimeType};base64,${att.dataBase64}`}
                                      download={att.fileName}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                        isMine
                                          ? "border-indigo-400/40 bg-indigo-500/30 hover:bg-indigo-500/40 text-white"
                                          : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <span className="truncate text-xs font-medium">
                                        {att.fileName}
                                      </span>
                                      <span className="text-[10px] opacity-60 shrink-0">
                                        ({(att.size / 1024).toFixed(1)} KB)
                                      </span>
                                      <Download className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Three-dot menu button */}
                          <button
                            onClick={() =>
                              setReactionMenuId(
                                reactionMenuId === m._id ? null : m._id,
                              )
                            }
                            className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all ${
                              reactionMenuId === m._id
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            } ${isMine ? "-left-9" : "-right-9"}`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Popup menu with reactions + edit/delete */}
                          {reactionMenuId === m._id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setReactionMenuId(null)}
                              />
                              <div
                                className={`absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-2 animate-in fade-in zoom-in-95 duration-150 ${
                                  isMine
                                    ? msgIdx === 0
                                      ? "right-0 top-full mt-2"
                                      : "right-0 bottom-full mb-2"
                                    : msgIdx === 0
                                      ? "left-0 top-full mt-2"
                                      : "left-0 bottom-full mb-2"
                                }`}
                              >
                                <div className="flex gap-1">
                                  {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() =>
                                        handleReaction(m._id, emoji)
                                      }
                                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all hover:scale-110"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                {/* Edit & Delete for own messages */}
                                {isMine && (
                                  <div className="border-t border-slate-200 dark:border-slate-600 mt-1.5 pt-1.5 flex gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(m._id);
                                        setEditInput(m.content);
                                        setReactionMenuId(null);
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-1"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteMessage(m._id);
                                        setReactionMenuId(null);
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Display existing reactions */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div
                        className={`flex flex-wrap gap-1 mt-1 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {Object.entries(reactionCounts).map(
                          ([emoji, { count, userReacted, names }]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(m._id, emoji)}
                              title={`${names.join(", ")} reacted with ${emoji}`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${
                                userReacted
                                  ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                  : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{count}</span>
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  const renderChatView = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">{renderChatHeader()}</div>
            <div className="flex items-center gap-2">
              {activeView === "channel" &&
                selectedChannel &&
                (selectedChannel.type === "private"
                  ? canManagePrivateChannelInvites
                  : true) && (
                  <button
                    onClick={openChannelSettingsModal}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                    title="Channel settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              {activeView === "dm" && (
                <>
                  <button
                    onClick={() => {
                      if (!selectedDM?._id || !selectedDMPeerUserId) return;
                      call.startCall({
                        dmId: selectedDM._id,
                        peerUserId: selectedDMPeerUserId,
                        type: "audio",
                      });
                    }}
                    disabled={!selectedDM?._id || !selectedDMPeerUserId}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      !selectedDMPeerUserId
                        ? "Audio call unavailable"
                        : "Start audio call"
                    }
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedDM?._id || !selectedDMPeerUserId) return;
                      call.startCall({
                        dmId: selectedDM._id,
                        peerUserId: selectedDMPeerUserId,
                        type: "video",
                      });
                    }}
                    disabled={!selectedDM?._id || !selectedDMPeerUserId}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      !selectedDMPeerUserId
                        ? "Video call unavailable"
                        : "Start video call"
                    }
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        {messagesLoading || messages.length === 0 ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {renderMessages()}
          </div>
        ) : (
          renderMessages()
        )}

        {/* Message Input */}
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <div className="relative flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-600">
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  showEmojiPicker
                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPendingFile(f);
                  e.target.value = "";
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPendingFile(f);
                  e.target.value = "";
                }}
              />

              {/* Emoji picker popup */}
              {showEmojiPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div className="absolute left-0 bottom-full mb-2 z-50">
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji: any) => {
                        setMessageInput((prev) => prev + emoji.native);
                        setShowEmojiPicker(false);
                      }}
                      theme="auto"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Pending file preview */}
            {pendingFile && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">
                  {pendingFile.type.startsWith("image/") ? (
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300 max-w-50 truncate">
                    {pendingFile.name}
                  </span>
                  <span className="text-slate-400 text-xs">
                    ({(pendingFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                activeView === "channel"
                  ? `Message #${selectedChannel?.name || "channel"}`
                  : isSelfDM
                    ? "Jot something down..."
                    : `Message ${selectedDM?.otherUser?.name || "DM"}`
              }
              className="w-full px-4 py-3 bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex items-center justify-end p-3">
              <Button
                onClick={handleSendMessage}
                disabled={
                  (!messageInput.trim() && !pendingFile) || !selectedRefId
                }
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-white dark:bg-slate-900 flex overflow-hidden">
      {/* Workspace Sidebar */}
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
              <button className="flex items-center gap-2 hover:bg-white/10 rounded-lg p-2 -m-2 transition-all flex-1 min-w-0">
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
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
              />
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto">
            {/* Overview link */}
            <div className="px-2 pt-3 pb-1">
              <button
                onClick={() => {
                  setUserPanel("overview");
                  setSelectedRefId(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                  userPanel === "overview"
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
              <button
                onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-white/60 hover:bg-white/10 rounded-lg transition-all group"
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
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </button>

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
                    channels.map((channel) => (
                      <button
                        key={channel._id}
                        onClick={() => selectChannel(channel._id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all group ${
                          userPanel === null &&
                          activeView === "channel" &&
                          selectedRefId === channel._id
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
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Direct Messages Section — shows all workspace members */}
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
                        // Check if there's an active DM thread with this member
                        const existingDM = member.user?._id
                          ? dmThreadByOtherUserId.get(String(member.user._id))
                          : undefined;
                        const isSelected =
                          activeView === "dm" &&
                          existingDM &&
                          selectedRefId === existingDM._id;

                        const unreadForThisDM = existingDM?._id
                          ? unreadDMCounts[existingDM._id] || 0
                          : 0;

                        return (
                          <button
                            key={member._id}
                            onClick={async () => {
                              if (!workspaceId || !member.user?._id) return;
                              try {
                                // Open or create a DM thread with this member (or self)
                                const dmThread = await dmService.openOrCreate(
                                  workspaceId,
                                  member.user._id,
                                );
                                // Enrich with other user info from member data
                                const enrichedDM = {
                                  ...dmThread,
                                  otherUser: {
                                    _id: member.user._id,
                                    name: member.user.fullName || "User",
                                    email: member.user.email,
                                    avatarUrl: member.user.avatarUrl,
                                  },
                                };
                                // Add to dms list if not already there
                                setDms((prev) => {
                                  const exists = prev.some(
                                    (d) => d._id === enrichedDM._id,
                                  );
                                  return exists ? prev : [...prev, enrichedDM];
                                });
                                setActiveView("dm");
                                setSelectedRefId(enrichedDM._id);
                                setUserPanel(null);
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

            {/* Boards Section — card format like channels */}
            <div className="px-2 py-3">
              <button
                onClick={() => setIsBoardsExpanded(!isBoardsExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-white/60 hover:bg-white/10 rounded-lg transition-all group"
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
                    setSidebarCreateBoard(true);
                    setUserPanel("boards");
                  }}
                  className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded transition-all"
                  title="Create new board"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </button>

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
                        setSelectedBoardId(null);
                        setSidebarCreateBoard(true);
                        setUserPanel("boards");
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
                        const isActive =
                          userPanel === "boards" &&
                          selectedBoardId === board._id;
                        return (
                          <button
                            key={board._id}
                            onClick={() => {
                              setSelectedBoardId(board._id);
                              setUserPanel("boards");
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                              isActive
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
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
                      {/* View all boards link */}
                      <button
                        onClick={() => {
                          setSelectedBoardId(null);
                          setBoardsViewKey((k) => k + 1);
                          setUserPanel("boards");
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
                  setUserPanel("profile");
                  setUserMenuOpen(false);
                }}
                onPreferences={() => {
                  setUserPanel("preferences");
                  setUserMenuOpen(false);
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
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
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

      {/* Sidebar resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="hidden lg:flex w-1 hover:w-1.5 cursor-col-resize items-center justify-center group z-40 shrink-0 transition-all"
      >
        <div className="w-0.5 h-8 rounded-full bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Top Header (overview only) */}
        {userPanel === "overview" && (
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20 shrink-0">
            <div className="px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserPanel("notifications")}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all relative"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  <button
                    onClick={openSettings}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main panels */}
        {userPanel === "overview" ? (
          <WorkspaceOverview
            workspace={workspace}
            channels={channels}
            dms={dms}
            members={members}
            boards={sidebarBoards}
            currentUserId={user?.id}
            onSelectChannel={(channelId) => {
              setActiveView("channel");
              setSelectedRefId(channelId);
              setUserPanel(null);
            }}
            onOpenBoards={() => {
              setSelectedBoardId(null);
              setBoardsViewKey((k) => k + 1);
              setUserPanel("boards");
            }}
          />
        ) : userPanel === "profile" ? (
          <UserProfile onBack={() => setUserPanel(null)} />
        ) : userPanel === "preferences" ? (
          <UserPreferences onBack={() => setUserPanel(null)} />
        ) : userPanel === "notifications" ? (
          <Notifications onBack={() => setUserPanel(null)} />
        ) : userPanel === "boards" ? (
          <KanbanBoard
            workspaceId={workspaceId!}
            members={members}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            initialBoardId={selectedBoardId}
            showAllKey={boardsViewKey}
            onBoardsChange={(boards) => setSidebarBoards(boards)}
            initialShowCreate={sidebarCreateBoard}
            onCreateHandled={() => setSidebarCreateBoard(false)}
          />
        ) : (
          <>
            {/* Chat View */}
            {renderChatView()}
          </>
        )}
      </div>

      {/* Create Channel Modal */}
      {isCreateChannelOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => !isCreatingChannel && setIsCreateChannelOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Create a channel
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Start a new conversation with your team
                  </p>
                </div>
                <button
                  onClick={() =>
                    !isCreatingChannel && setIsCreateChannelOpen(false)
                  }
                  disabled={isCreatingChannel}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="channel-name"
                    className="block text-sm font-semibold text-slate-900 dark:text-white mb-2"
                  >
                    Channel Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      label="Channel Name"
                      hideLabel
                      id="channel-name"
                      type="text"
                      placeholder="e.g., project-updates"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="pl-10"
                      disabled={isCreatingChannel}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Channel names must be lowercase, without spaces or periods.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <button
                    onClick={() => {
                      if (!canCreatePrivateChannel) return;
                      setNewChannelPrivate(!newChannelPrivate);
                    }}
                    className={`w-12 h-7 rounded-full transition-all ${
                      newChannelPrivate ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                    disabled={isCreatingChannel || !canCreatePrivateChannel}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                        newChannelPrivate ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {newChannelPrivate ? (
                        <Lock className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      ) : (
                        <Globe className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      )}
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {newChannelPrivate ? "Private" : "Public"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {newChannelPrivate
                        ? "Only invited members can access"
                        : "Anyone in the workspace can join"}
                    </p>
                    {!canCreatePrivateChannel && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Only workspace admins or owners can create private
                        channels.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateChannelOpen(false)}
                    disabled={isCreatingChannel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateChannel}
                    disabled={isCreatingChannel || !newChannelName.trim()}
                    className="flex-1 gap-2"
                  >
                    {isCreatingChannel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Hash className="w-4 h-4" />
                        Create Channel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Channel Settings Modal */}
      {isChannelInviteOpen && selectedChannel && (
        <>
          <div
            onClick={() =>
              !isInvitingMembers &&
              !isSavingChannelName &&
              !removingChannelMemberId &&
              !isDeletingChannel &&
              setIsChannelInviteOpen(false)
            }
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/70 w-full max-w-2xl animate-in zoom-in duration-200 overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Channel Settings
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {selectedChannel.type === "private"
                      ? `Manage #${selectedChannel.name}. Only invited members can access this private channel.`
                      : `Manage #${selectedChannel.name}. Everyone in this workspace can access this channel.`}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {selectedChannel.type === "private"
                      ? "Private channel access controls"
                      : "Public channel settings"}
                  </div>
                </div>
                <button
                  onClick={() => setIsChannelInviteOpen(false)}
                  disabled={
                    isInvitingMembers ||
                    isSavingChannelName ||
                    Boolean(removingChannelMemberId) ||
                    isDeletingChannel
                  }
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-[72vh] overflow-y-auto space-y-5 bg-slate-50/60 dark:bg-slate-900/20">
                <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Rename Channel
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {selectedChannel.type === "private"
                          ? "Update the private channel name."
                          : "Update the channel name."}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Quick edit
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        label="Rename Channel"
                        hideLabel
                        type="text"
                        value={channelNameDraft}
                        onChange={(e) => setChannelNameDraft(e.target.value)}
                        className="pl-9"
                        disabled={
                          isSavingChannelName || !canRenameSelectedChannel
                        }
                      />
                    </div>
                    <Button
                      onClick={handleRenameChannel}
                      disabled={
                        isSavingChannelName ||
                        !channelNameDraft.trim() ||
                        !canRenameSelectedChannel
                      }
                      className="shrink-0 min-w-24 h-10 px-5 rounded-lg text-sm font-semibold"
                    >
                      {isSavingChannelName ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>

                  {!canRenameSelectedChannel && (
                    <div className="text-xs rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-amber-700 dark:text-amber-300">
                      Only workspace admins can rename channels.
                    </div>
                  )}
                </section>

                {selectedChannel.type === "private" && (
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Invite Members
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Select workspace members who should gain access.
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
                        {selectedInviteeIds.length} selected
                      </span>
                    </div>
                    {inviteableChannelMembers.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/80 dark:bg-slate-900/30">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Everyone available is already invited
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {inviteableChannelMembers.map((member) => {
                          const userId = String(member.user._id);
                          const isSelected =
                            selectedInviteeIds.includes(userId);
                          return (
                            <button
                              key={member._id}
                              onClick={() => toggleInvitee(userId)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                              }`}
                            >
                              <div className="w-10 h-10 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {getInitials(member.user.fullName || "U")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {member.user.fullName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {member.user.email}
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-indigo-500 bg-indigo-500 text-white"
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        New invitees will immediately gain access to this
                        channel.
                      </p>
                      <Button
                        onClick={handleInviteChannelMembers}
                        disabled={
                          isInvitingMembers || selectedInviteeIds.length === 0
                        }
                        className="gap-2 h-10 px-4 rounded-lg text-sm font-semibold"
                      >
                        {isInvitingMembers ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Inviting...
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4" />
                            Invite Selected
                          </>
                        )}
                      </Button>
                    </div>
                  </section>
                )}

                {selectedChannel.type === "public" && (
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Members
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Everyone in this workspace can access this channel.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {members.length} members
                      </span>
                    </div>

                    <div className="space-y-2">
                      {members.map((member) => {
                        const name = member.user?.fullName || "User";
                        const email = member.user?.email || "";
                        return (
                          <div
                            key={member._id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20"
                          >
                            <div className="w-10 h-10 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {getInitials(name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {email}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {selectedChannel.type === "private" && (
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Current Members
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Remove access for members who should no longer see
                          this channel.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {currentPrivateChannelMembers.length} members
                      </span>
                    </div>
                    <div className="space-y-2">
                      {currentPrivateChannelMembers.map((member) => {
                        const memberId = String(member.user._id);
                        const isCreator =
                          String(selectedChannel.createdBy) === memberId;
                        const isRemoving = removingChannelMemberId === memberId;

                        return (
                          <div
                            key={member._id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20"
                          >
                            <div className="w-10 h-10 bg-linear-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {getInitials(member.user.fullName || "U")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {member.user.fullName}
                                </div>
                                {isCreator && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                                    Creator
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {member.user.email}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleRemoveChannelMember(memberId)
                              }
                              disabled={isCreator || isRemoving}
                              className="shrink-0 h-10 px-4 rounded-lg text-sm font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30 disabled:border-slate-200 disabled:text-slate-400"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Delete Channel
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        This permanently removes #{selectedChannel.name} and its
                        messages.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Permanent
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Type{" "}
                      <span className="font-semibold">
                        {selectedChannel.name}
                      </span>{" "}
                      to confirm deletion.
                    </p>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        label="Confirm channel name"
                        hideLabel
                        type="text"
                        value={deleteChannelConfirmName}
                        onChange={(e) =>
                          setDeleteChannelConfirmName(e.target.value)
                        }
                        className="pl-9"
                        disabled={!isWorkspaceOwner || isDeletingChannel}
                      />
                    </div>
                  </div>

                  {!isWorkspaceOwner && (
                    <div className="text-xs rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-amber-700 dark:text-amber-300">
                      Only workspace owners can delete channels.
                    </div>
                  )}

                  <div className="flex justify-end">
                    {isWorkspaceOwner && (
                      <button
                        type="button"
                        onClick={handleDeleteChannel}
                        disabled={
                          isDeletingChannel ||
                          deleteChannelConfirmName.trim() !==
                            selectedChannel.name
                        }
                        className="inline-flex items-center justify-center gap-2 min-w-46 px-4 h-10 rounded-lg text-sm font-medium border border-rose-600 bg-rose-600 text-white transition-all duration-200 hover:bg-rose-700 hover:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-rose-400 disabled:border-rose-400 disabled:text-white disabled:opacity-100"
                      >
                        {isDeletingChannel ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Delete Channel
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </section>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsChannelInviteOpen(false)}
                    disabled={
                      isInvitingMembers ||
                      isSavingChannelName ||
                      Boolean(removingChannelMemberId) ||
                      isDeletingChannel
                    }
                    className="h-10 px-4 rounded-lg text-sm font-semibold"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Call Modal */}
      <CallModal
        open={call.status !== "idle"}
        status={call.status}
        type={call.type}
        peerName={callPeerName}
        peerInitials={callPeerInitials}
        error={call.error}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        micEnabled={call.micEnabled}
        camEnabled={call.camEnabled}
        onAccept={() => call.acceptCall()}
        onReject={() => call.rejectCall("declined")}
        onHangup={handleHangup}
        onToggleMic={() => call.toggleMic()}
        onToggleCam={() => call.toggleCam()}
      />

      {/* ─── Workspace Settings Panel ─────────────────────── */}
      {isSettingsOpen && (
        <WorkspaceSettings
          workspace={workspace}
          members={members}
          channels={channels}
          onClose={() => setIsSettingsOpen(false)}
          onWorkspaceUpdate={(ws) => setWorkspace(ws)}
          onMembersChange={(updated) => setMembers(updated)}
        />
      )}
    </div>
  );
}
