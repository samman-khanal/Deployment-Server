//? Importing necessary modules and models.
import * as inviteService from "../services/workspaceInvite.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Controller function to get invite preview by token (no auth required).
export const getByToken = async (req, res, next) => {
  try {
    res.json(await inviteService.getInvitePreview(req.params.token));
  } catch (e) {
    next(e);
  }
};

//* Controller function to create a new workspace invite.
export const create = async (req, res, next) => {
  try {
    const inv = await inviteService.createInvite({
      workspaceId: req.params.workspaceId,
      email: req.body.email,
      invitedBy: req.user._id,
    });
    res.status(HTTP.CREATED).json(inv);
  } catch (e) {
    next(e);
  }
};

//* Controller function to list all invites of a workspace.
export const list = async (req, res, next) => {
  try {
    res.json(await inviteService.listInvites(req.params.workspaceId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to accept a workspace invite.
export const accept = async (req, res, next) => {
  try {
    res.json(
      await inviteService.acceptInvite({
        token: req.params.token,
        userId: req.user._id,
      }),
    );
  } catch (e) {
    next(e);
  }
};

//* Controller function to reject a workspace invite.
export const reject = async (req, res, next) => {
  try {
    res.json(
      await inviteService.rejectInvite({
        token: req.params.token,
        userId: req.user._id,
      }),
    );
  } catch (e) {
    next(e);
  }
};

//* Controller function to cancel a pending workspace invite.
export const cancel = async (req, res, next) => {
  try {
    res.json(await inviteService.cancelInvite(req.params.inviteId));
  } catch (e) {
    next(e);
  }
};
