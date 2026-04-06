import * as dmService from "../services/dm.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

export const createOrGet = async (req, res, next) => {
  try {
    const dm = await dmService.createOrGetDM({
      workspaceId: req.params.workspaceId,
      userId: req.user._id,
      otherUserId: req.body.otherUserId,
    });
    res.status(HTTP.CREATED).json(dm);
  } catch (e) {
    next(e);
  }
};

export const listMine = async (req, res, next) => {
  try {
    const rows = await dmService.listMyDMs({
      workspaceId: req.params.workspaceId,
      userId: req.user._id,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};
