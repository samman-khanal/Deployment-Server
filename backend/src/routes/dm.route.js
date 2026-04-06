import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import requireWorkspaceMember from "../middlewares/requireWorkspaceMember.middleware.js";
import * as dmController from "../controllers/dm.controller.js";

const router = Router();

router.post(
  "/workspaces/:workspaceId/dms",
  auth,
  requireWorkspaceMember,
  dmController.createOrGet,
);
router.get(
  "/workspaces/:workspaceId/dms",
  auth,
  requireWorkspaceMember,
  dmController.listMine,
);

export default router;
