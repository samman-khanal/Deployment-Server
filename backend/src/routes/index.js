//? Importing necessary modules and models.
import { Router } from "express";

import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import workspaceRoutes from "./workspace.route.js";
import workspaceMemberRoutes from "./workspaceMember.route.js";
import workspaceInviteRoutes from "./workspaceInvite.route.js";
import boardRoutes from "./board.route.js";
import columnRoutes from "./column.route.js";
import taskRoutes from "./task.route.js";
import commentRoutes from "./comment.route.js";
import attachmentRoutes from "./attachment.route.js";
import notificationRoutes from "./notification.route.js";
import channelRoutes from "./channel.route.js";
import messageRoutes from "./message.route.js";
import subscriptionRoutes from "./subscription.route.js";
import khaltiRoutes from "./khalti.route.js";

import dmRoutes from "./dm.route.js";
import contactRoutes from "./contact.route.js";


const router = Router();

//* Mounting auth and user routes.
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/khalti", khaltiRoutes);

//* Mounting workspace-related routes.
router.use("/workspaces", workspaceRoutes);
router.use("/workspaces", workspaceMemberRoutes);
router.use("/workspaces", workspaceInviteRoutes);

//* Mounting board, column, task, comment, and attachment routes.
router.use("/", boardRoutes);
router.use("/", columnRoutes);
router.use("/", taskRoutes);
router.use("/", commentRoutes);
router.use("/", attachmentRoutes);

//* Mounting notification routes.
router.use("/notifications", notificationRoutes);

//* Mounting channel and message routes.
router.use("/", channelRoutes);
router.use("/", messageRoutes);

router.use("/", dmRoutes);

router.use("/", contactRoutes);

export default router;
