//? Importing necessary modules and models.
import * as commentService from "../services/comment.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Controller function to create a new comment on a specific task.
export const create = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const c = await commentService.addComment({
      taskId: req.params.taskId,
      userId: req.user._id,
      text: req.body.text,
      io,
    });
    res.status(HTTP.CREATED).json(c);
  } catch (e) {
    next(e);
  }
};

//* Controller function to list all comments for a specific task.
export const list = async (req, res, next) => {
  try {
    res.json(await commentService.listComments(req.params.taskId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to delete a specific comment.
export const remove = async (req, res, next) => {
  try {
    res.json(
      await commentService.deleteComment(req.params.commentId, req.user._id),
    );
  } catch (e) {
    next(e);
  }
};
