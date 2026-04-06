//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import * as taskController from "../controllers/task.controller.js";

const router = Router();

//* Task routes with authentication middleware.
router.post(
  "/boards/:boardId/columns/:columnId/tasks",
  auth,
  taskController.create,
);
router.get("/boards/:boardId/tasks", auth, taskController.listByBoard);

router.get(
  "/workspaces/:workspaceId/my-tasks",
  auth,
  taskController.myWorkspaceTasks,
);
router.get("/tasks/:taskId", auth, taskController.getOne);
router.patch("/tasks/:taskId", auth, taskController.update);
router.delete("/tasks/:taskId", auth, taskController.remove);

router.patch("/tasks/:taskId/move", auth, taskController.move);
router.patch(
  "/columns/:columnId/tasks/reorder",
  auth,
  taskController.reorderInColumn,
);

export default router;
