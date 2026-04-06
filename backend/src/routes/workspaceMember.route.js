//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import requireWorkspaceMember from "../middlewares/requireWorkspaceMember.middleware.js";
import { requireWorkspaceRole } from "../middlewares/requireWorkspaceRole.middleware.js";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";
import * as memberController from "../controllers/workspaceMember.controller.js";

const router = Router();

//* Workspace member routes with authentication middleware.
router.get(
  "/:workspaceId/members",
  auth,
  requireWorkspaceMember,
  memberController.list,
);

router.patch(
  "/:workspaceId/members/:memberId/role",
  auth,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN]),
  memberController.changeRole,
);

router.delete(
  "/:workspaceId/members/:memberId",
  auth,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN]),
  memberController.remove,
);

export default router;
