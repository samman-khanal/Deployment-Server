//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import requireWorkspaceMember from "../middlewares/requireWorkspaceMember.middleware.js";
import { requireWorkspaceRole } from "../middlewares/requireWorkspaceRole.middleware.js";
import { checkWorkspaceLimit } from "../middlewares/subscription.middleware.js";
import { WORKSPACE_ROLES } from "../constants/workspaceRoles.constant.js";
import * as workspaceController from "../controllers/workspace.controller.js";

const router = Router();

//* Workspace routes with authentication middleware.
router.post("/", auth, checkWorkspaceLimit, workspaceController.create);
router.get("/", auth, workspaceController.listMine);

router.get(
  "/:workspaceId",
  auth,
  requireWorkspaceMember,
  workspaceController.getOne,
);
router.patch(
  "/:workspaceId",
  auth,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN]),
  workspaceController.update,
);
router.delete(
  "/:workspaceId",
  auth,
  requireWorkspaceMember,
  requireWorkspaceRole([WORKSPACE_ROLES.OWNER]),
  workspaceController.remove,
);

export default router;
