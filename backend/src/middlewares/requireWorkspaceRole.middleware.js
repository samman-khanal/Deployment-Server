//? Importing necessary modules and models.
import { HTTP } from "../constants/httpStatus.constant.js";

//* Middleware function to check if the user has the required role in the workspace.
export const requireWorkspaceRole =
  (allowed = []) =>
  (req, res, next) => {
    const role = req.workspaceMember?.role;
    if (!allowed.includes(role))
      return res.status(HTTP.FORBIDDEN).json({ message: "Forbidden" });
    next();
  };
