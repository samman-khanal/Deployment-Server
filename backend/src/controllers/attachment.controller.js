//? Importing necessary modules and models.
import * as attachmentService from "../services/attachment.service.js";
import { HTTP } from "../constants/httpStatus.constant.js";

//* Controller function to upload an attachment to a specific task.
export const uploadOne = async (req, res, next) => {
  try {
    const a = await attachmentService.uploadAttachment({
      taskId: req.params.taskId,
      userId: req.user._id,
      file: req.file,
    });
    res.status(HTTP.CREATED).json(a);
  } catch (e) {
    next(e);
  }
};

//* Controller function to list all attachments for a specific task.
export const list = async (req, res, next) => {
  try {
    res.json(await attachmentService.listAttachments(req.params.taskId));
  } catch (e) {
    next(e);
  }
};

//* Controller function to delete a specific attachment.
export const remove = async (req, res, next) => {
  try {
    res.json(
      await attachmentService.deleteAttachment(
        req.params.attachmentId,
        req.user._id,
      ),
    );
  } catch (e) {
    next(e);
  }
};
