import * as channelService from "../services/channel.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";
import { APP_EVENTS } from "../constants/appEvents.constant.js";

export const create = async (req, res, next) => {
  try {
    const c = await channelService.createChannel({
      workspaceId: req.params.workspaceId,
      name: req.body.name,
      type: req.body.type || "public",
      userId: req.user._id,
    });
    req.app.get("io")
      .to(`workspace:${req.params.workspaceId}`)
      .emit(APP_EVENTS.CHANNEL_CREATED, c);
    res.status(HTTP.CREATED).json(c);
  } catch (e) {
    next(e);
  }
};

export const list = async (req, res, next) => {
  try {
    const rows = await channelService.listChannels({
      workspaceId: req.params.workspaceId,
      userId: req.user._id,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

export const addMembers = async (req, res, next) => {
  try {
    const channel = await channelService.addMembersToChannel({
      channelId: req.params.channelId,
      userIds: req.body.userIds || [],
    });
    if (!channel)
      return res.status(404).json({ message: "Channel not found" });
    req.app.get("io")
      .to(`workspace:${String(channel.workspace)}`)
      .emit(APP_EVENTS.CHANNEL_UPDATED, channel);
    res.json(channel);
  } catch (e) {
    next(e);
  }
};

export const update = async (req, res, next) => {
  try {
    const channel = await channelService.updateChannel({
      channelId: req.params.channelId,
      name: req.body.name,
    });
    if (!channel)
      return res.status(404).json({ message: "Channel not found" });
    req.app.get("io")
      .to(`workspace:${String(channel.workspace)}`)
      .emit(APP_EVENTS.CHANNEL_UPDATED, channel);
    res.json(channel);
  } catch (e) {
    next(e);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const channel = await channelService.removeMemberFromChannel({
      channelId: req.params.channelId,
      memberId: req.params.memberId,
    });
    req.app.get("io")
      .to(`workspace:${String(channel.workspace)}`)
      .emit(APP_EVENTS.CHANNEL_UPDATED, channel);
    res.json(channel);
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    const channel = await channelService.deleteChannel({
      channelId: req.params.channelId,
    });
    req.app.get("io")
      .to(`workspace:${String(channel.workspace)}`)
      .emit(APP_EVENTS.CHANNEL_DELETED, { _id: String(channel._id) });
    res.json(channel);
  } catch (e) {
    next(e);
  }
};

export const join = async (req, res, next) => {
  try {
    const c = await channelService.joinChannel({
      channelId: req.params.channelId,
      userId: req.user._id,
    });
    res.json(c);
  } catch (e) {
    next(e);
  }
};

export const leave = async (req, res, next) => {
  try {
    const c = await channelService.leaveChannel({
      channelId: req.params.channelId,
      userId: req.user._id,
    });
    res.json(c);
  } catch (e) {
    next(e);
  }
};
