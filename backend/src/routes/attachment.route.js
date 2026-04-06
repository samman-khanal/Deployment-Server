//? Importing necessary modules and models.
import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../utils/fileUpload.util.js";
import * as attachmentController from "../controllers/attachment.controller.js";

const router = Router();

//* Attachment routes with authentication middleware.
router.post(
  "/tasks/:taskId/attachments",
  auth,
  upload.single("file"),
  attachmentController.uploadOne,
);
router.get("/tasks/:taskId/attachments", auth, attachmentController.list);
router.delete("/attachments/:attachmentId", auth, attachmentController.remove);

export default router;
