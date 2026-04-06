//? Importing necessary modules and models.
import * as userService from "../services/user.service.js";

//* Controller function to get the current user's information.
export const me = async (req, res, next) => {
  try {
    res.json(await userService.getMe(req.user._id));
  } catch (e) {
    next(e);
  }
};

//* Controller function to update the current user's information.
export const updateMe = async (req, res, next) => {
  try {
    res.json(await userService.updateMe(req.user._id, req.body));
  } catch (e) {
    next(e);
  }
};

//* Controller function to upload a new avatar image.
export const uploadAvatar = async (req, res, next) => {
  try {
    res.json(await userService.updateAvatar(req.user._id, req.file));
  } catch (e) {
    next(e);
  }
};

//* Controller function to change the current user's password.
export const changePassword = async (req, res, next) => {
  try {
    res.json(
      await userService.changePassword(req.user._id, req.body.newPassword),
    );
  } catch (e) {
    next(e);
  }
};
