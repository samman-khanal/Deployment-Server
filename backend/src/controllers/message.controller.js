import * as messageService from "../services/message.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

export const sendToChannel = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    let mentions = [];
    if (req.body.mentions) {
      try { mentions = JSON.parse(req.body.mentions); } catch { /* ignore */ }
    }
    const msg = await messageService.sendChannelMessage({
      channelId: req.params.channelId,
      senderId: req.user._id,
      content: req.body.content,
      file: req.file,
      mentions,
      io,
    });
    res.status(HTTP.CREATED).json(msg);
  } catch (e) {
    next(e);
  }
};

export const listChannel = async (req, res, next) => {
  try {
    const rows = await messageService.listChannelMessages({
      channelId: req.params.channelId,
      userId: req.user._id,
      limit: req.query.limit,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

export const edit = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const msg = await messageService.editMessage({
      messageId: req.params.messageId,
      userId: req.user._id,
      newContent: req.body.content,
      io,
    });
    res.json(msg);
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    res.json(
      await messageService.deleteMessage({
        messageId: req.params.messageId,
        userId: req.user._id,
        io,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const react = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const msg = await messageService.toggleReaction({
      messageId: req.params.messageId,
      userId: req.user._id,
      emoji: req.body.emoji,
      io,
    });
    res.json(msg);
  } catch (e) {
    next(e);
  }
};

//TODO

export const sendToDM = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    let mentions = [];
    if (req.body.mentions) {
      try { mentions = JSON.parse(req.body.mentions); } catch { /* ignore */ }
    }
    const msg = await messageService.sendDMMessage({
      dmId: req.params.dmId,
      senderId: req.user._id,
      content: req.body.content,
      file: req.file,
      mentions,
      io,
    });
    res.status(HTTP.CREATED).json(msg);
  } catch (e) {
    next(e);
  }
};

export const listDM = async (req, res, next) => {
  try {
    const rows = await messageService.listDMMessages({
      dmId: req.params.dmId,
      userId: req.user._id,
      limit: req.query.limit,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};
