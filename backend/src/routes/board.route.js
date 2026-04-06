//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import requireWorkspaceMember from "../middlewares/requireWorkspaceMember.middleware.js";
import { checkBoardLimit } from "../middlewares/subscription.middleware.js";
import * as boardController from "../controllers/board.controller.js";

const router = Router();

//* Board routes with authentication middleware.
router.post(
  "/workspaces/:workspaceId/boards",
  auth,
  requireWorkspaceMember,
  checkBoardLimit,
  boardController.create,
);
router.get(
  "/workspaces/:workspaceId/boards",
  auth,
  requireWorkspaceMember,
  boardController.list,
);

router.get("/boards/:boardId", auth, boardController.getOne);
router.patch("/boards/:boardId", auth, boardController.update);
router.delete("/boards/:boardId", auth, boardController.remove);

export default router;
