//? Importing necessary modules and models.
import * as notifService from "../services/notification.service.js";

//* Controller function to list all notifications for the current user.
export const list = async (req, res, next) => {
  try {
    res.json(await notifService.listNotifications(req.user._id));
  } catch (e) {
    next(e);
  }
};

//* Controller function to mark a specific notification as read.
export const read = async (req, res, next) => {
  try {
    res.json(await notifService.markRead(req.user._id, req.params.id));
  } catch (e) {
    next(e);
  }
};

//* Controller function to mark all notifications as read for the current user.
export const readAll = async (req, res, next) => {
  try {
    res.json(await notifService.markAllRead(req.user._id));
  } catch (e) {
    next(e);
  }
};
