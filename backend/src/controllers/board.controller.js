//? Importing necessary modules and models.
import * as boardService from "../services/board.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";
import { APP_EVENTS } from "../constants/appEvents.constant.js";

//* Controller function to create a new board in a specific workspace.
export const create = async (req, res, next) => {
  try {
    const data = await boardService.createBoard({
      workspaceId: req.params.workspaceId,
      name: req.body.name,
      userId: req.user._id,
      methodology: req.body.methodology,
    });
    req.app.get("io")
      .to(`workspace:${req.params.workspaceId}`)
      .emit(APP_EVENTS.BOARD_CREATED, data);
    res.status(HTTP.CREATED).json(data);
  } catch (e) {
    next(e);
  }
};

//* Controller function to list all boards in a specific workspace.
export const list = async (req, res, next) => {
  try {
    res.json(await boardService.listBoards(req.params.workspaceId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to get a specific board's information.
export const getOne = async (req, res, next) => {
  try {
    res.json(await boardService.getBoard(req.params.boardId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to update a board's information.
export const update = async (req, res, next) => {
  try {
    const board = await boardService.updateBoard(req.params.boardId, req.body);
    if (!board)
      return res.status(404).json({ message: "Board not found" });
    req.app.get("io")
      .to(`workspace:${String(board.workspace)}`)
      .emit(APP_EVENTS.BOARD_UPDATED, board);
    res.json(board);
  } catch (e) {
    next(e);
  }
};

//* Controller function to delete a board.
export const remove = async (req, res, next) => {
  try {
    const result = await boardService.deleteBoard(req.params.boardId);
    req.app.get("io")
      .to(`workspace:${result.workspaceId}`)
      .emit(APP_EVENTS.BOARD_DELETED, { boardId: result.boardId });
    res.json(result);
  } catch (e) {
    next(e);
  }
};
