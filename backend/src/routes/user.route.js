//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../utils/fileUpload.util.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

//* User profile routes with authentication middleware.
router.get("/me", auth, userController.me);
router.patch("/me", auth, userController.updateMe);
router.patch("/me/avatar", auth, upload.single("avatar"), userController.uploadAvatar);
router.patch("/me/password", auth, userController.changePassword);

export default router;
