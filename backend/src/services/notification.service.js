import Notification from "../models/Notification.model.js";

export const createNotification = async ({
  userId,
  type,
  message,
  meta = {},
  io,
}) => {
  const notif = await Notification.create({
    user: userId,
    type,
    message,
    meta,
    deliveredAt: new Date(),
  });

  // Real-time push if socket is available
  if (io) {
    io.to(`user:${String(userId)}`).emit("notification:new", notif);
  }

  return notif;
};

export const listNotifications = async (userId) =>
  Notification.find({ user: userId }).sort({ createdAt: -1 });

export const markRead = async (userId, id) => {
  await Notification.updateOne(
    { _id: id, user: userId },
    { readAt: new Date() },
  );
  return { read: true };
};

export const markAllRead = async (userId) => {
  await Notification.updateMany(
    { user: userId, readAt: null },
    { readAt: new Date() },
  );
  return { readAll: true };
};
