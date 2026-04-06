//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import * as columnController from "../controllers/column.controller.js";

const router = Router();

//* Column routes with authentication middleware.
router.post("/boards/:boardId/columns", auth, columnController.create);
router.get("/boards/:boardId/columns", auth, columnController.list);
router.patch("/columns/:columnId", auth, columnController.update);
router.delete("/columns/:columnId", auth, columnController.remove);

router.patch(
  "/boards/:boardId/columns/reorder",
  auth,
  columnController.reorder,
);

export default router;
