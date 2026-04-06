import { Server } from "socket.io";
import { corsOptions } from "../config/cors.config.js";
import { verifyToken } from "../utils/jwt.util.js";
import { APP_EVENTS } from "../constants/appEvents.constant.js";
import DMConversation from "../models/DMConversation.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";

export const initSockets = (httpServer, app) => {
  const io = new Server(httpServer, { cors: corsOptions });

  // Presence tracking (in-memory, per-process)
  // userSockets: userId → Set<socketId>
  const userSockets = new Map();
  // userWorkspaces: userId → Set<workspaceId>
  const userWorkspaces = new Map();
  // workspaceOnlineUsers: workspaceId → Set<userId>
  const workspaceOnlineUsers = new Map();

  const assertDmParticipants = async ({ dmId, fromUserId, toUserId }) => {
    if (!dmId) {
      throw Object.assign(new Error("dmId is required"), { statusCode: 400 });
    }
    if (!toUserId) {
      throw Object.assign(new Error("toUserId is required"), { statusCode: 400 });
    }

    const dm = await DMConversation.findById(dmId).select("participants");
    if (!dm) {
      throw Object.assign(new Error("DM not found"), { statusCode: 404 });
    }

    const participants = dm.participants.map((p) => String(p));
    const from = String(fromUserId);
    const to = String(toUserId);

    if (!participants.includes(from)) {
      throw Object.assign(new Error("Not a participant of this DM"), {
        statusCode: 403,
      });
    }
    if (!participants.includes(to)) {
      throw Object.assign(new Error("Target user is not in this DM"), {
        statusCode: 403,
      });
    }
  };

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;

    // Track this socket
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    if (!userWorkspaces.has(uid)) userWorkspaces.set(uid, new Set());

    // user room for notifications
    socket.join(`user:${uid}`);

    // join/leave workspace rooms — verify membership first to prevent unauthorized room access
    socket.on(APP_EVENTS.WORKSPACE_JOIN, async (workspaceId, ack) => {
      try {
        const member = await WorkspaceMember.findOne({
          workspace: workspaceId,
          user: uid,
        });
        if (!member) {
          ack?.({ ok: false, onlineUsers: [] });
          return;
        }
        socket.join(`workspace:${workspaceId}`);

        // Track presence
        userWorkspaces.get(uid).add(workspaceId);
        if (!workspaceOnlineUsers.has(workspaceId))
          workspaceOnlineUsers.set(workspaceId, new Set());
        workspaceOnlineUsers.get(workspaceId).add(uid);

        // Broadcast to workspace that this user came online
        socket.to(`workspace:${workspaceId}`).emit(APP_EVENTS.USER_ONLINE, { userId: uid, workspaceId });

        // Ack with current online users so the joining client can sync state
        const onlineUsers = [...(workspaceOnlineUsers.get(workspaceId) || [])];
        ack?.({ ok: true, onlineUsers });
      } catch {
        ack?.({ ok: false, onlineUsers: [] });
      }
    });
    socket.on(APP_EVENTS.WORKSPACE_LEAVE, (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      // Only remove from presence if this is the user's last socket in this workspace
      const stillInWorkspace = [...(userSockets.get(uid) || [])].some(
        (sid) => sid !== socket.id && io.sockets.sockets.get(sid)?.rooms?.has(`workspace:${workspaceId}`)
      );
      if (!stillInWorkspace) {
        userWorkspaces.get(uid)?.delete(workspaceId);
        workspaceOnlineUsers.get(workspaceId)?.delete(uid);
        io.to(`workspace:${workspaceId}`).emit(APP_EVENTS.USER_OFFLINE, { userId: uid, workspaceId });
      }
    });

    // join/leave channel rooms
    socket.on(APP_EVENTS.CHANNEL_JOIN, (channelId) =>
      socket.join(`channel:${channelId}`),
    );
    socket.on(APP_EVENTS.CHANNEL_LEAVE, (channelId) =>
      socket.leave(`channel:${channelId}`),
    );

    // join/leave board rooms — verify workspace membership to prevent unauthorized access
    socket.on(APP_EVENTS.BOARD_JOIN, async (boardId) => {
      try {
        const Board = (await import("../models/Board.model.js")).default;
        const board = await Board.findById(boardId).select("workspace");
        if (!board) return;
        
        const member = await WorkspaceMember.findOne({
          workspace: board.workspace,
          user: socket.userId,
        });
        if (member) socket.join(`board:${boardId}`);
      } catch {
        // silently ignore DB errors
      }
    });
    socket.on(APP_EVENTS.BOARD_LEAVE, (boardId) =>
      socket.leave(`board:${boardId}`),
    );

    // join/leave dm rooms
    socket.on(APP_EVENTS.DM_JOIN, (dmId) => socket.join(`dm:${dmId}`));
    socket.on(APP_EVENTS.DM_LEAVE, (dmId) => socket.leave(`dm:${dmId}`));

    // ─── Calls (WebRTC signaling relay) ──────────────────────────────────
    // Clients exchange SDP offers/answers and ICE candidates through the server.
    // We validate that both users are participants of the DM thread.

    socket.on(APP_EVENTS.CALL_OFFER, async (payload, ack) => {
      try {
        const { dmId, toUserId, callId, type, sdp } = payload || {};
        await assertDmParticipants({
          dmId,
          fromUserId: socket.userId,
          toUserId,
        });

        io.to(`user:${toUserId}`).emit(APP_EVENTS.CALL_OFFER, {
          dmId,
          callId,
          type,
          sdp,
          fromUserId: socket.userId,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, message: e?.message || "Failed to send offer" });
      }
    });

    socket.on(APP_EVENTS.CALL_ANSWER, async (payload, ack) => {
      try {
        const { dmId, toUserId, callId, sdp } = payload || {};
        await assertDmParticipants({
          dmId,
          fromUserId: socket.userId,
          toUserId,
        });

        io.to(`user:${toUserId}`).emit(APP_EVENTS.CALL_ANSWER, {
          dmId,
          callId,
          sdp,
          fromUserId: socket.userId,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, message: e?.message || "Failed to send answer" });
      }
    });

    socket.on(APP_EVENTS.CALL_ICE_CANDIDATE, async (payload, ack) => {
      try {
        const { dmId, toUserId, callId, candidate } = payload || {};
        await assertDmParticipants({
          dmId,
          fromUserId: socket.userId,
          toUserId,
        });

        io.to(`user:${toUserId}`).emit(APP_EVENTS.CALL_ICE_CANDIDATE, {
          dmId,
          callId,
          candidate,
          fromUserId: socket.userId,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, message: e?.message || "Failed to send ICE" });
      }
    });

    socket.on(APP_EVENTS.CALL_END, async (payload, ack) => {
      try {
        const { dmId, toUserId, callId, reason } = payload || {};
        await assertDmParticipants({
          dmId,
          fromUserId: socket.userId,
          toUserId,
        });
        io.to(`user:${toUserId}`).emit(APP_EVENTS.CALL_END, {
          dmId,
          callId,
          reason,
          fromUserId: socket.userId,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, message: e?.message || "Failed to end call" });
      }
    });

    socket.on(APP_EVENTS.CALL_REJECT, async (payload, ack) => {
      try {
        const { dmId, toUserId, callId, reason } = payload || {};
        await assertDmParticipants({
          dmId,
          fromUserId: socket.userId,
          toUserId,
        });
        io.to(`user:${toUserId}`).emit(APP_EVENTS.CALL_REJECT, {
          dmId,
          callId,
          reason,
          fromUserId: socket.userId,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, message: e?.message || "Failed to reject call" });
      }
    });

    socket.on(APP_EVENTS.CALL_BUSY, async (payload, ack) => {
      try {
        const { dmId, toUserId, callId } = payload || {};
        await assertDmParticipants({
          dmId,
          fromUserId: socket.userId,
          toUserId,
        });
        io.to(`user:${toUserId}`).emit(APP_EVENTS.CALL_BUSY, {
          dmId,
          callId,
          fromUserId: socket.userId,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, message: e?.message || "Failed to send busy" });
      }
    });

    // ─── Disconnect: clean up presence ───────────────────────────────────
    socket.on("disconnect", () => {
      const sockets = userSockets.get(uid);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          // Last socket for this user — broadcast offline to all their workspaces
          userSockets.delete(uid);
          const workspaces = userWorkspaces.get(uid) || new Set();
          for (const workspaceId of workspaces) {
            workspaceOnlineUsers.get(workspaceId)?.delete(uid);
            io.to(`workspace:${workspaceId}`).emit(APP_EVENTS.USER_OFFLINE, { userId: uid, workspaceId });
          }
          userWorkspaces.delete(uid);
        }
      }
    });
  });

  app.set("io", io);
  console.log("Socket.IO ready (JWT auth enabled)");
  return io;
};
