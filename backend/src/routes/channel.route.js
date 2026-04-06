import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import requireWorkspaceMember from "../middlewares/requireWorkspaceMember.middleware.js";
import { requireWorkspaceRole } from "../middlewares/requireWorkspaceRole.middleware.js";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";
import Channel from "../models/Channel.model.js";
import * as channelController from "../controllers/channel.controller.js";

const router = Router();

const attachWorkspaceIdFromChannel = async (req, res, next) => {
  const ch = await Channel.findById(req.params.channelId);
  if (!ch) return res.status(404).json({ message: "Channel not found" });
  req.params.workspaceId = String(ch.workspace);
  next();
};

router.post(
  "/workspaces/:workspaceId/channels",
  auth,
  requireWorkspaceMember,
  channelController.create,
);
router.get(
  "/workspaces/:workspaceId/channels",
  auth,
  requireWorkspaceMember,
  channelController.list,
);

router.patch(
  "/channels/:channelId",
  auth,
  attachWorkspaceIdFromChannel,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN]),
  channelController.update,
);

// ✅ Add members to channel (private channel use-case)
// We need workspaceId for role check, so we fetch the channel's workspace via a small inline middleware.
router.post(
  "/channels/:channelId/members",
  auth,
  attachWorkspaceIdFromChannel,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN]),
  channelController.addMembers,
);

router.delete(
  "/channels/:channelId/members/:memberId",
  auth,
  attachWorkspaceIdFromChannel,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN]),
  channelController.removeMember,
);

router.delete(
  "/channels/:channelId",
  auth,
  attachWorkspaceIdFromChannel,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER]),
  channelController.remove,
);

router.post("/channels/:channelId/join", auth, channelController.join);
router.post("/channels/:channelId/leave", auth, channelController.leave);

export default router;
