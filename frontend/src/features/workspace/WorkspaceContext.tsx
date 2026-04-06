import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import workspaceService from "../../services/workspace.service";
import channelService from "../../services/channel.service";
import dmService from "../../services/dm.service";
import workspaceMemberService from "../../services/workspaceMember.service";
import boardService from "../../services/board.service";
import { getSocket, EVENTS } from "../../services/socket.service";
import { useAuth } from "../../hooks/useAuth";

import type { Workspace } from "../../services/workspace.service";
import type { Channel } from "../../services/channel.service";
import type { DMThread } from "../../services/dm.service";
import type { Message } from "../../services/message.service";
import type { WorkspaceMember } from "../../services/workspaceMember.service";
import type { Board } from "../../services/board.service";

/* ─── helpers ─── */

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/* ─── Context shape ─── */

interface WorkspaceContextValue {
  workspaceId: string;
  workspace: Workspace | null;
  workspaceLoading: boolean;
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  channelsLoading: boolean;
  dms: DMThread[];
  setDms: React.Dispatch<React.SetStateAction<DMThread[]>>;
  members: WorkspaceMember[];
  setMembers: React.Dispatch<React.SetStateAction<WorkspaceMember[]>>;
  membersLoading: boolean;
  sidebarBoards: Board[];
  setSidebarBoards: React.Dispatch<React.SetStateAction<Board[]>>;
  boardsLoading: boolean;

  // Messages for the active conversation
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  messagesLoading: boolean;
  setMessagesLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Unread counts
  unreadChannelCounts: Record<string, number>;
  setUnreadChannelCounts: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  unreadDMCounts: Record<string, number>;
  setUnreadDMCounts: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;

  // Role helpers
  myWorkspaceRole: string | null;
  isWorkspaceOwner: boolean;

  // Workspace update
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;

  // DM thread lookup
  dmThreadByOtherUserId: Map<string, DMThread>;

  // Presence
  onlineUsers: Set<string>;
}

const WorkspaceCtx = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

/* ─── Provider ─── */

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();

  // Workspace
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Data
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<DMThread[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  // Boards
  const [sidebarBoards, setSidebarBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);

  // Messages for active conversation (managed externally by channel/dm pages)
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Unread counts
  const [unreadChannelCounts, setUnreadChannelCounts] = useState<
    Record<string, number>
  >({});
  const [unreadDMCounts, setUnreadDMCounts] = useState<Record<string, number>>(
    {},
  );

  // Presence
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const countedMessageIdsRef = useRef<Set<string>>(new Set());
  const generalCreatedRef = useRef(false);

  // Role helpers
  const myWorkspaceRole = useMemo(() => {
    const currentMember = members.find((m) => m.user?._id === user?.id);
    return currentMember?.role || null;
  }, [members, user]);

  const isWorkspaceOwner = myWorkspaceRole === "owner";

  // DM lookup
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

  // Unread persistence
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

  // Reset per-workspace refs
  useEffect(() => {
    generalCreatedRef.current = false;
    countedMessageIdsRef.current.clear();
  }, [workspaceId]);

  // ─── Load workspace data ───
  useEffect(() => {
    if (!workspaceId) return;

    (async () => {
      try {
        setWorkspaceLoading(true);
        try {
          const ws = await workspaceService.getById(workspaceId);
          if (ws) setWorkspace(ws);
        } catch {
          // fallback
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

        // Auto-create #general if missing
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
            finalChannels = ch;
          }
        }

        setChannels(finalChannels);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load workspace");
      } finally {
        setChannelsLoading(false);
        setMembersLoading(false);
        setBoardsLoading(false);
      }
    })();
  }, [workspaceId]);

  // ─── Socket: join workspace room ───
  useEffect(() => {
    if (!workspaceId) return;
    const socket = getSocket();

    // Join room and get initial online users via ack
    socket.emit(EVENTS.WORKSPACE_JOIN, workspaceId, (res: { ok: boolean; onlineUsers: string[] }) => {
      if (res?.onlineUsers) {
        setOnlineUsers(new Set(res.onlineUsers));
      }
    });

    const onUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };
    const onUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on(EVENTS.USER_ONLINE, onUserOnline);
    socket.on(EVENTS.USER_OFFLINE, onUserOffline);

    return () => {
      socket.emit(EVENTS.WORKSPACE_LEAVE, workspaceId);
      socket.off(EVENTS.USER_ONLINE, onUserOnline);
      socket.off(EVENTS.USER_OFFLINE, onUserOffline);
      setOnlineUsers(new Set());
    };
  }, [workspaceId]);

  // ─── Socket: channel/DM rooms for unread tracking ───
  useEffect(() => {
    const socket = getSocket();
    channels.forEach((ch) => socket.emit(EVENTS.CHANNEL_JOIN, ch._id));
    dms.forEach((dm) => socket.emit(EVENTS.DM_JOIN, dm._id));

    // Channel message → unread tracking  (message appending is done in ChannelPage)
    const onChannelNew = (msg: Message) => {
      const channelId = String((msg as any).channel || "");
      if (!channelId) return;
      const isOwn = Boolean(msg.sender?._id && user?.id && msg.sender._id === user.id);
      if (!isOwn) {
        if (countedMessageIdsRef.current.has(msg._id)) return;
        countedMessageIdsRef.current.add(msg._id);
        setUnreadChannelCounts((prev) => ({
          ...prev,
          [channelId]: (prev[channelId] || 0) + 1,
        }));
      }
    };

    const onDMNew = (msg: Message) => {
      const dmId = String((msg as any).dm || "");
      if (!dmId) return;
      const isOwn = Boolean(msg.sender?._id && user?.id && msg.sender._id === user.id);
      if (!isOwn) {
        if (countedMessageIdsRef.current.has(msg._id)) return;
        countedMessageIdsRef.current.add(msg._id);
        setUnreadDMCounts((prev) => ({
          ...prev,
          [dmId]: (prev[dmId] || 0) + 1,
        }));
      }
    };

    socket.on(EVENTS.CHANNEL_MESSAGE_NEW, onChannelNew);
    socket.on(EVENTS.DM_MESSAGE_NEW, onDMNew);

    return () => {
      channels.forEach((ch) => socket.emit(EVENTS.CHANNEL_LEAVE, ch._id));
      dms.forEach((dm) => socket.emit(EVENTS.DM_LEAVE, dm._id));
      socket.off(EVENTS.CHANNEL_MESSAGE_NEW, onChannelNew);
      socket.off(EVENTS.DM_MESSAGE_NEW, onDMNew);
    };
  }, [channels, dms, user?.id]);

  // ─── Socket: workspace structural events ───
  useEffect(() => {
    if (!workspaceId) return;
    const socket = getSocket();

    const onChannelCreated = (channel: Channel) => {
      setChannels((prev) =>
        prev.some((c) => c._id === channel._id) ? prev : [channel, ...prev],
      );
    };
    const onChannelDeleted = ({ _id }: { _id: string }) => {
      setChannels((prev) => prev.filter((c) => c._id !== _id));
    };
    const onChannelUpdated = (updated: Channel) => {
      setChannels((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
    };
    const onMemberRemoved = ({
      memberId,
      userId: removedUserId,
    }: {
      memberId: string;
      userId: string;
    }) => {
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      if (removedUserId === user?.id) {
        toast.error("You have been removed from this workspace.");
        navigate("/selector");
      }
    };
    const onMemberRoleChanged = (updated: WorkspaceMember) => {
      setMembers((prev) =>
        prev.map((m) =>
          m._id === updated._id ? { ...m, role: updated.role } : m,
        ),
      );
    };
    const onBoardCreated = (board: Board) => {
      setSidebarBoards((prev) =>
        prev.some((b) => b._id === board._id) ? prev : [board, ...prev],
      );
    };
    const onBoardDeleted = ({ boardId }: { boardId: string }) => {
      setSidebarBoards((prev) => prev.filter((b) => b._id !== boardId));
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

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaceId: workspaceId || "",
      workspace,
      workspaceLoading,
      channels,
      setChannels,
      channelsLoading,
      dms,
      setDms,
      members,
      setMembers,
      membersLoading,
      sidebarBoards,
      setSidebarBoards,
      boardsLoading,
      messages,
      setMessages,
      messagesLoading,
      setMessagesLoading,
      unreadChannelCounts,
      setUnreadChannelCounts,
      unreadDMCounts,
      setUnreadDMCounts,
      myWorkspaceRole,
      isWorkspaceOwner,
      setWorkspace,
      dmThreadByOtherUserId,
      onlineUsers,
    }),
    [
      workspaceId,
      workspace,
      workspaceLoading,
      channels,
      channelsLoading,
      dms,
      members,
      membersLoading,
      sidebarBoards,
      boardsLoading,
      messages,
      messagesLoading,
      unreadChannelCounts,
      unreadDMCounts,
      myWorkspaceRole,
      isWorkspaceOwner,
      dmThreadByOtherUserId,
      onlineUsers,
    ],
  );

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}
