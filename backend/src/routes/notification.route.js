//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import * as controller from "../controllers/notification.controller.js";

const router = Router();

//* Notification routes with authentication middleware.
router.get("/", auth, controller.list);
router.patch("/:id/read", auth, controller.read);
router.patch("/read-all", auth, controller.readAll);

export default router;
