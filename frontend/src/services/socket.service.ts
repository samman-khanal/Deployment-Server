import { io, Socket } from "socket.io-client";

/**
 * Singleton Socket.IO client.
 *
 * The backend runs at the same origin as the API but Socket.IO
 * listens on the root path, so we strip "/api" from the base URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string; // e.g. "http://localhost:3000/api"
const SOCKET_URL = new URL(API_BASE_URL).origin; // always just the host, e.g. "http://localhost:3000"

let socket: Socket | null = null;

/** Get (or create) the shared socket instance. */
export function getSocket(): Socket {
  if (socket) return socket;

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("[socket] connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("[socket] connect_error:", err.message);
  });

  return socket;
}

/** Disconnect and discard the socket (e.g. on logout). */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** App event constants — mirror of backend APP_EVENTS */
export const EVENTS = {
  // Workspace structural / sidebar events
  WORKSPACE_JOIN: "workspace:join",
  WORKSPACE_LEAVE: "workspace:leave",
  CHANNEL_CREATED: "workspace:channel:created",
  CHANNEL_DELETED: "workspace:channel:deleted",
  CHANNEL_UPDATED: "workspace:channel:updated",
  WORKSPACE_MEMBER_REMOVED: "workspace:member:removed",
  WORKSPACE_MEMBER_ROLE_CHANGED: "workspace:member:role:changed",
  BOARD_CREATED: "workspace:board:created",
  BOARD_DELETED: "workspace:board:deleted",
  BOARD_UPDATED: "workspace:board:updated",

  // Room management
  CHANNEL_JOIN: "channel:join",
  CHANNEL_LEAVE: "channel:leave",
  BOARD_JOIN: "board:join",
  BOARD_LEAVE: "board:leave",
  DM_JOIN: "dm:join",
  DM_LEAVE: "dm:leave",

  // Board tasks
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_MOVED: "task:moved",
  TASK_DELETED: "task:deleted",

  // Channel messages
  CHANNEL_MESSAGE_NEW: "channel:message:new",
  CHANNEL_MESSAGE_EDITED: "channel:message:edited",
  CHANNEL_MESSAGE_DELETED: "channel:message:deleted",
  CHANNEL_MESSAGE_REACTED: "channel:message:reacted",

  // DM messages
  DM_MESSAGE_NEW: "dm:message:new",
  DM_MESSAGE_EDITED: "dm:message:edited",
  DM_MESSAGE_DELETED: "dm:message:deleted",
  DM_MESSAGE_REACTED: "dm:message:reacted",

  // Notifications
  NOTIFICATION_NEW: "notification:new",

  // Typing indicators
  CHANNEL_TYPING_START: "channel:typing:start",
  CHANNEL_TYPING_STOP: "channel:typing:stop",
  CHANNEL_USER_TYPING: "channel:user:typing",
  CHANNEL_USER_STOPPED_TYPING: "channel:user:stopped_typing",
  DM_TYPING_START: "dm:typing:start",
  DM_TYPING_STOP: "dm:typing:stop",
  DM_USER_TYPING: "dm:user:typing",
  DM_USER_STOPPED_TYPING: "dm:user:stopped_typing",

  // Calls (WebRTC signaling)
  CALL_OFFER: "call:offer",
  CALL_ANSWER: "call:answer",
  CALL_ICE_CANDIDATE: "call:ice-candidate",
  CALL_END: "call:end",
  CALL_REJECT: "call:reject",
  CALL_BUSY: "call:busy",

  // Presence
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  PRESENCE_SYNC: "presence:sync",
} as const;
