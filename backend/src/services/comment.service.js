//? Importing necessary modules and models.
import Comment from "../models/Comment.model.js";
import Task from "../models/Task.model.js";
import User from "../models/User.model.js";
import Board from "../models/Board.model.js";
import Workspace from "../models/Workspace.model.js";
import { sendEmail } from "../utils/sendEmail.util.js";
import { taskCommentedTemplate } from "../utils/email/taskCommented.emai.js";
import { createNotification } from "./notification.service.js";

const toIdString = (value) => String(value);

const buildTaskUrl = (boardId) => {
  const frontendBaseUrl = process.env.FRONTEND_URL;
  if (!frontendBaseUrl) return "";
  return `${frontendBaseUrl}/boards/${toIdString(boardId)}`;
};

const notifyTaskCommentRecipients = async ({
  task,
  commenter,
  comment,
  io,
}) => {
  const recipientIds = new Set([
    ...(task.assignees || []).map(toIdString),
    toIdString(task.createdBy),
  ]);

  recipientIds.delete(toIdString(commenter._id));
  if (!recipientIds.size) return;

  const [board, recipients] = await Promise.all([
    Board.findById(task.board).select("name workspace").lean(),
    User.find({ _id: { $in: [...recipientIds] } })
      .select("fullName email")
      .lean(),
  ]);
  if (!recipients.length) return;

  const workspace = board?.workspace
    ? await Workspace.findById(board.workspace).select("name").lean()
    : null;

  const workspaceName = workspace?.name || "your workspace";
  const boardName = board?.name || "your board";
  const taskUrl = buildTaskUrl(task.board);

  await Promise.allSettled([
    ...recipients
      .filter((r) => Boolean(r.email))
      .map((recipient) =>
        sendEmail({
          to: recipient.email,
          subject: `New comment on task: ${task.title}`,
          html: taskCommentedTemplate({
            recipientName: recipient.fullName,
            commenterName: commenter.fullName,
            taskTitle: task.title,
            commentText: comment.text,
            workspaceName,
            boardName,
            taskUrl,
          }),
        }),
      ),
    ...recipients.map((recipient) =>
      createNotification({
        userId: recipient._id,
        type: "task_comment",
        message: `${commenter.fullName} commented on task \"${task.title}\"`,
        meta: {
          taskId: task._id,
          boardId: task.board,
          commentId: comment._id,
          commenterName: commenter.fullName,
          preview: (comment.text || "").slice(0, 120),
        },
        io,
      }),
    ),
  ]);
};

//* Service function to add a new comment to a task.
export const addComment = async ({ taskId, userId, text, io }) => {
  const [task, commenter] = await Promise.all([
    Task.findById(taskId).select("title board assignees createdBy").lean(),
    User.findById(userId).select("fullName").lean(),
  ]);

  if (!task)
    throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  if (!commenter)
    throw Object.assign(new Error("User not found"), { statusCode: 404 });

  const comment = await Comment.create({ task: taskId, author: userId, text });

  await notifyTaskCommentRecipients({
    task,
    commenter,
    comment,
    io,
  });

  return comment;
};

//* Service function to list all comments for a task.
export const listComments = async (taskId) =>
  Comment.find({ task: taskId })
    .populate("author", "fullName email avatarUrl")
    .sort({ createdAt: 1 });

//* Service function to delete a comment by its ID.
export const deleteComment = async (commentId, userId) => {
  //* Allowing to delete own comment only.
  const c = await Comment.findById(commentId);
  if (!c)
    throw Object.assign(new Error("Comment not found"), { statusCode: 404 });
  if (String(c.author) !== String(userId))
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

  await Comment.deleteOne({ _id: commentId });
  return { deleted: true };
};
