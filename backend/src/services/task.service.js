//? Importing necessary modules and models.
import Task from "../models/Task.model.js";
import Column from "../models/Column.model.js";
import User from "../models/User.model.js";
import Board from "../models/Board.model.js";
import Workspace from "../models/Workspace.model.js";
import { sendEmail } from "../utils/sendEmail.util.js";
import { taskAssignedTemplate } from "../utils/email/taskAssigned.emai.js";

const toIdString = (value) => String(value);

const normalizeAssignees = (assignees) => {
  if (!Array.isArray(assignees)) return [];
  const deduped = new Set(assignees.map(toIdString));
  return [...deduped];
};

const buildTaskUrl = (boardId) => {
  const frontendBaseUrl = process.env.FRONTEND_URL;
  if (!frontendBaseUrl) return "";
  return `${frontendBaseUrl}/boards/${toIdString(boardId)}`;
};

const loadAssignmentMailContext = async ({ boardId, assignedByUserId }) => {
  const [board, assignedBy] = await Promise.all([
    Board.findById(boardId).select("name workspace").lean(),
    User.findById(assignedByUserId).select("fullName").lean(),
  ]);

  const workspace = board?.workspace
    ? await Workspace.findById(board.workspace).select("name").lean()
    : null;

  return {
    workspaceName: workspace?.name || "your workspace",
    boardName: board?.name || "your board",
    assignedByName: assignedBy?.fullName || "A teammate",
  };
};

const notifyNewAssignees = async ({
  task,
  nextAssigneeIds,
  previousAssigneeIds = [],
  assignedByUserId,
}) => {
  if (!assignedByUserId) return;

  const previousSet = new Set(previousAssigneeIds.map(toIdString));
  const newlyAssignedIds = nextAssigneeIds.filter(
    (id) => !previousSet.has(toIdString(id)),
  );

  if (!newlyAssignedIds.length) return;

  const assignees = await User.find({ _id: { $in: newlyAssignedIds } })
    .select("fullName email")
    .lean();
  if (!assignees.length) return;

  const context = await loadAssignmentMailContext({
    boardId: task.board,
    assignedByUserId,
  });
  const taskUrl = buildTaskUrl(task.board);

  await Promise.allSettled(
    assignees
      .filter((assignee) => Boolean(assignee.email))
      .map((assignee) =>
        sendEmail({
          to: assignee.email,
          subject: `New task assigned: ${task.title}`,
          html: taskAssignedTemplate({
            assigneeName: assignee.fullName,
            taskTitle: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
            workspaceName: context.workspaceName,
            boardName: context.boardName,
            assignedByName: context.assignedByName,
            taskUrl,
          }),
        }),
      ),
  );
};

//* Service function to create a new task in a column.
export const createTask = async ({
  boardId,
  columnId,
  title,
  description,
  assignees,
  dueDate,
  priority,
  checklist,
  userId,
}) => {
  const count = await Task.countDocuments({ column: columnId });

  const normalizedAssignees = normalizeAssignees(assignees);
  const task = await Task.create({
    board: boardId,
    column: columnId,
    title,
    ...(description !== undefined ? { description } : {}),
    ...(dueDate !== undefined ? { dueDate } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(checklist !== undefined ? { checklist } : {}),
    assignees: normalizedAssignees,
    createdBy: userId,
    order: count,
  });

  await notifyNewAssignees({
    task,
    nextAssigneeIds: normalizedAssignees,
    assignedByUserId: userId,
  });

  return task;
};

//* Service function to list all tasks in a board.
export const listTasksByBoard = async (boardId) =>
  Task.find({ board: boardId }).sort({ order: 1, createdAt: 1 });

//* Service function to get a task by its ID.
export const getTask = async (taskId) => Task.findById(taskId);

//* Service function to update a task's details.
export const updateTask = async (taskId, patch, userId) => {
  const existingTask = await Task.findById(taskId).select(
    "assignees board title dueDate priority",
  );
  if (!existingTask) return null;

  const allowed = ["title", "description", "assignees", "dueDate", "priority", "completed", "checklist"];
  const update = {};
  for (const k of allowed) if (patch[k] !== undefined) update[k] = patch[k];

  if (update.assignees !== undefined) {
    update.assignees = normalizeAssignees(update.assignees);
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, update, { new: true });

  if (updatedTask && update.assignees !== undefined) {
    await notifyNewAssignees({
      task: updatedTask,
      nextAssigneeIds: update.assignees,
      previousAssigneeIds: existingTask.assignees || [],
      assignedByUserId: userId,
    });
  }

  return updatedTask;
};

//* Service function to delete a task by its ID.
export const deleteTask = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task)
    throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  
  await Task.deleteOne({ _id: taskId });
  return { deleted: true, taskId: String(task._id), boardId: String(task.board) };
};

//* Service function to move a task to another column.
export const moveTask = async ({ taskId, toColumnId, toOrder }) => {
  const toColumn = await Column.findById(toColumnId);
  if (!toColumn)
    throw Object.assign(new Error("Target column not found"), {
      statusCode: 404,
    });

  const task = await Task.findById(taskId);
  if (!task)
    throw Object.assign(new Error("Task not found"), { statusCode: 404 });

  task.column = toColumnId;
  if (typeof toOrder === "number") task.order = toOrder;
  await task.save();

  return task;
};

//* Service function to get tasks assigned to a user across all boards in a workspace.
export const getMyWorkspaceTasks = async ({ workspaceId, userId }) => {
  const Board = (await import("../models/Board.model.js")).default;
  const boardIds = await Board.find({ workspace: workspaceId }).distinct("_id");
  return Task.find({
    board: { $in: boardIds },
    assignees: userId,
  })
    .populate("board", "name")
    .populate("column", "name")
    .sort({ dueDate: 1, createdAt: -1 });
};

//* Service function to reorder tasks within a column.
export const reorderTasksInColumn = async ({ columnId, orderedIds }) => {
  const ops = orderedIds.map((id, idx) => ({
    updateOne: {
      filter: { _id: id, column: columnId },
      update: { order: idx },
    },
  }));
  await Task.bulkWrite(ops);
  return { reordered: true };
};
