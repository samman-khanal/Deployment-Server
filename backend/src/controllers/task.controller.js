//? Importing necessary modules and models.
import * as taskService from "../services/task.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";
import { APP_EVENTS } from "../constants/appEvents.constant.js";

//* Controller function to create a new task in a specific column of a board.
export const create = async (req, res, next) => {
  try {
    const data = await taskService.createTask({
      boardId: req.params.boardId,
      columnId: req.params.columnId,
      title: req.body.title,
      description: req.body.description,
      assignees: req.body.assignees,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      checklist: req.body.checklist,
      userId: req.user._id,
    });
    // Emit task creation to the board to update all viewers in real-time
    req.app.get("io")
      .to(`board:${req.params.boardId}`)
      .emit(APP_EVENTS.TASK_CREATED, data);
    res.status(HTTP.CREATED).json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to list all tasks in a specific board.
export const listByBoard = async (req, res, next) => {
  try {
    res.json(await taskService.listTasksByBoard(req.params.boardId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to get a specific task's information.
export const getOne = async (req, res, next) => {
  try {
    res.json(await taskService.getTask(req.params.taskId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to update a task's information.
export const update = async (req, res, next) => {
  try {
    const data = await taskService.updateTask(req.params.taskId, req.body, req.user._id);
    if (!data)
      return res.status(HTTP.NOT_FOUND).json({ message: "Task not found" });
    // Emit task update to the board to update all viewers in real-time
    req.app.get("io")
      .to(`board:${String(data.board)}`)
      .emit(APP_EVENTS.TASK_UPDATED, data);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to delete a task.
export const remove = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.taskId);
    // Emit task deletion to the board to update all viewers in real-time
    req.app.get("io")
      .to(`board:${result.boardId}`)
      .emit(APP_EVENTS.TASK_DELETED, { taskId: result.taskId });
    res.json(result);
  } catch (e) {
    next(e);
  }
};

//* Controller function to move a task to a different column or reorder it within the same column.
export const move = async (req, res, next) => {
  try {
    const data = await taskService.moveTask({
      taskId: req.params.taskId,
      toColumnId: req.body.toColumnId,
      toOrder: req.body.toOrder,
    });
    // Emit task move to the board to update all viewers in real-time
    req.app.get("io")
      .to(`board:${String(data.board)}`)
      .emit(APP_EVENTS.TASK_MOVED, data);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to get tasks assigned to the current user in a workspace.
export const myWorkspaceTasks = async (req, res, next) => {
  try {
    res.json(
      await taskService.getMyWorkspaceTasks({
        workspaceId: req.params.workspaceId,
        userId: req.user._id,
      }),
    );
  } catch (e) {
    next(e);
  }
};

//* Controller function to reorder tasks within the same column.
export const reorderInColumn = async (req, res, next) => {
  try {
    res.json(
      await taskService.reorderTasksInColumn({
        columnId: req.params.columnId,
        orderedIds: req.body.orderedIds,
      }),
    );
  } catch (e) {
    next(e);
  }
};
