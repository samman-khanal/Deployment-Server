//? Importing necessary modules and models.
import * as columnService from "../services/column.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Controller function to create a new column in a specific board.
export const create = async (req, res, next) => {
  try {
    res
      .status(HTTP.CREATED)
      .json(
        await columnService.createColumn({
          boardId: req.params.boardId,
          title: req.body.title,
        }),
      );
  } catch (e) {
    next(e);
  }
};

//* Controller function to list all columns in a specific board.
export const list = async (req, res, next) => {
  try {
    res.json(await columnService.listColumns(req.params.boardId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to update a column's information.
export const update = async (req, res, next) => {
  try {
    res.json(await columnService.updateColumn(req.params.columnId, req.body));
  } catch (e) {
    next(e);
  }
};

//* Controller function to delete a column.
export const remove = async (req, res, next) => {
  try {
    res.json(await columnService.deleteColumn(req.params.columnId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to reorder columns within a specific board.
export const reorder = async (req, res, next) => {
  try {
    res.json(
      await columnService.reorderColumns({
        boardId: req.params.boardId,
        orderedIds: req.body.orderedIds,
      }),
    );
  } catch (e) {
    next(e);
  }
};
