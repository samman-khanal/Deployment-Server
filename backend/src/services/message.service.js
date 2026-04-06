import Message from "../models/Message.model.js";
import Channel from "../models/Channel.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import User from "../models/User.model.js";

import { createNotification } from "./notification.service.js";
import { APP_EVENTS } from "../constants/appEvents.constant.js";

export const sendChannelMessage = async ({
  channelId,
  senderId,
  content,
  file,
  mentions = [],
  io,
}) => {
  const channel = await Channel.findById(channelId);
  if (!channel)
    throw Object.assign(new Error("Channel not found"), { statusCode: 404 });

  // must be channel member (private) or workspace member (public)
  const isMember = channel.members.some(
    (id) => String(id) === String(senderId),
  );
  if (!isMember) {
    if (channel.type === "private") {
      throw Object.assign(new Error("Not a channel member"), { statusCode: 403 });
    }
    // Public channel: verify workspace membership and auto-add
    const wsMember = await WorkspaceMember.findOne({
      workspace: channel.workspace,
      user: senderId,
    });
    if (!wsMember)
      throw Object.assign(new Error("Not a workspace member"), { statusCode: 403 });
    // Auto-add to channel members for future checks
    channel.members.push(senderId);
    await channel.save();
  }

  const attachments = [];
  if (file) {
    attachments.push({
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      dataBase64: file.buffer.toString("base64"),
    });
  }

  const msg = await Message.create({
    channel: channelId,
    dm: null,
    sender: senderId,
    content: content || "",
    attachments,
    mentions,
  });

  // Mentions -> notifications (explicit array of userIds from client)
  if (mentions.length) {
    const sender = await User.findById(senderId).select("fullName");
    await Promise.all(
      mentions
        .filter((id) => String(id) !== String(senderId))
        .map((userId) =>
          createNotification({
            userId,
            type: "mention",
            message: `${sender?.fullName || "Someone"} mentioned you in #${channel.name}`,
            meta: {
              channelId,
              messageId: msg._id,
              senderName: sender?.fullName || "Unknown",
              senderId: String(senderId),
              channelName: channel.name,
              preview: (content || "").slice(0, 120),
            },
            io,
          }),
        ),
    );
  }

  // emit to channel room
  const populated = await Message.findById(msg._id)
    .populate("sender", "fullName email avatarUrl")
    .populate("mentions", "fullName _id");
  if (io)
    io.to(`channel:${String(channelId)}`).emit(
      APP_EVENTS.CHANNEL_MESSAGE_NEW,
      populated,
    );

  return populated;
};

export const listChannelMessages = async ({
  channelId,
  userId,
  limit = 50,
}) => {
  const channel = await Channel.findById(channelId);
  if (!channel)
    throw Object.assign(new Error("Channel not found"), { statusCode: 404 });

  const isMember = channel.members.some((id) => String(id) === String(userId));
  if (!isMember) {
    if (channel.type === "private") {
      throw Object.assign(new Error("Not a channel member"), { statusCode: 403 });
    }
    // Public channel: verify workspace membership and auto-add
    const wsMember = await WorkspaceMember.findOne({
      workspace: channel.workspace,
      user: userId,
    });
    if (!wsMember)
      throw Object.assign(new Error("Not a workspace member"), { statusCode: 403 });
    channel.members.push(userId);
    await channel.save();
  }

  return Message.find({ channel: channelId })
    .populate("sender", "fullName email avatarUrl")
    .populate("mentions", "fullName _id")
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200));
};

export const editMessage = async ({ messageId, userId, newContent, io }) => {
  const msg = await Message.findById(messageId);
  if (!msg)
    throw Object.assign(new Error("Message not found"), { statusCode: 404 });
  if (String(msg.sender) !== String(userId))
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  if (msg.deletedAt)
    throw Object.assign(new Error("Message deleted"), { statusCode: 400 });

  msg.content = newContent;
  msg.editedAt = new Date();
  await msg.save();

  const populated = await Message.findById(msg._id)
    .populate("sender", "fullName email avatarUrl")
    .populate("mentions", "fullName _id");
  if (io) {
    if (msg.channel)
      io.to(`channel:${String(msg.channel)}`).emit(
        APP_EVENTS.CHANNEL_MESSAGE_EDITED,
        populated,
      );
    if (msg.dm)
      io.to(`dm:${String(msg.dm)}`).emit(APP_EVENTS.DM_MESSAGE_EDITED, populated);
  }

  return populated;
};

export const deleteMessage = async ({ messageId, userId, io }) => {
  const msg = await Message.findById(messageId);
  if (!msg)
    throw Object.assign(new Error("Message not found"), { statusCode: 404 });
  if (String(msg.sender) !== String(userId))
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

  msg.deletedAt = new Date();
  await msg.save();

  if (io) {
    if (msg.channel)
      io.to(`channel:${String(msg.channel)}`).emit(
        APP_EVENTS.CHANNEL_MESSAGE_DELETED,
        { _id: msg._id },
      );
    if (msg.dm)
      io.to(`dm:${String(msg.dm)}`).emit(APP_EVENTS.DM_MESSAGE_DELETED, {
        _id: msg._id,
      });
  }

  return { deleted: true };
};

export const toggleReaction = async ({ messageId, userId, emoji, io }) => {
  const msg = await Message.findById(messageId);
  if (!msg)
    throw Object.assign(new Error("Message not found"), { statusCode: 404 });
  if (msg.deletedAt)
    throw Object.assign(new Error("Message deleted"), { statusCode: 400 });

  const idx = msg.reactions.findIndex(
    (r) => r.emoji === emoji && String(r.user) === String(userId),
  );
  if (idx >= 0) msg.reactions.splice(idx, 1);
  else msg.reactions.push({ emoji, user: userId });

  await msg.save();

  const populated = await Message.findById(msg._id).populate("sender", "fullName email avatarUrl");
  if (io) {
    if (msg.channel)
      io.to(`channel:${String(msg.channel)}`).emit(
        APP_EVENTS.CHANNEL_MESSAGE_REACTED,
        populated,
      );
    if (msg.dm)
      io.to(`dm:${String(msg.dm)}`).emit(APP_EVENTS.DM_MESSAGE_REACTED, populated);
  }

  return populated;
};

//TODO

// import Message from "../models/Message.model.js";
import DMConversation from "../models/DMConversation.model.js";
// import User from "../models/User.model.js";
// import { createNotification } from "./notification.service.js";
// import { APP_EVENTS } from "../constants/appEvents.js";

// ✅ Send message to DM (with optional file)
export const sendDMMessage = async ({ dmId, senderId, content, file, mentions = [], io }) => {
  const dm = await DMConversation.findById(dmId);
  if (!dm) throw Object.assign(new Error("DM not found"), { statusCode: 404 });

  const isParticipant = dm.participants.some(
    (id) => String(id) === String(senderId),
  );
  if (!isParticipant)
    throw Object.assign(new Error("Not a DM participant"), { statusCode: 403 });

  const attachments = [];
  if (file) {
    attachments.push({
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      dataBase64: file.buffer.toString("base64"),
    });
  }

  const msg = await Message.create({
    dm: dmId,
    channel: null,
    sender: senderId,
    content: content || "",
    attachments,
    mentions,
  });

  // ✅ Notify the other participant
  const otherUserId = dm.participants.find(
    (id) => String(id) !== String(senderId),
  );
  if (otherUserId) {
    const sender = await User.findById(senderId).select("fullName");
    await createNotification({
      userId: otherUserId,
      type: "dm_message",
      message: `${sender?.fullName || "Someone"} sent you a direct message`,
      meta: {
        dmId,
        messageId: msg._id,
        senderName: sender?.fullName || "Unknown",
        senderId: String(senderId),
        preview: (content || "").slice(0, 120),
      },
      io,
    });

    // ✅ Notify explicitly @mentioned users in DM
    if (mentions.length) {
      const sender2 = await User.findById(senderId).select("fullName");
      await Promise.all(
        mentions
          .filter((id) => String(id) !== String(senderId) && String(id) !== String(otherUserId))
          .map((userId) =>
            createNotification({
              userId,
              type: "mention",
              message: `${sender2?.fullName || "Someone"} mentioned you in a direct message`,
              meta: {
                dmId,
                messageId: msg._id,
                senderName: sender2?.fullName || "Unknown",
                senderId: String(senderId),
                preview: (content || "").slice(0, 120),
              },
              io,
            }),
          ),
      );
    }
  }

  // ✅ Emit to DM room
  const populated = await Message.findById(msg._id)
    .populate("sender", "fullName email avatarUrl")
    .populate("mentions", "fullName _id");
  if (io) io.to(`dm:${String(dmId)}`).emit(APP_EVENTS.DM_MESSAGE_NEW, populated);

  return populated;
};

// ✅ List DM messages
export const listDMMessages = async ({ dmId, userId, limit = 50 }) => {
  const dm = await DMConversation.findById(dmId);
  if (!dm) throw Object.assign(new Error("DM not found"), { statusCode: 404 });

  const isParticipant = dm.participants.some(
    (id) => String(id) === String(userId),
  );
  if (!isParticipant)
    throw Object.assign(new Error("Not a DM participant"), { statusCode: 403 });

  return Message.find({ dm: dmId })
    .populate("sender", "fullName email avatarUrl")
    .populate("mentions", "fullName _id")
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200));
};
