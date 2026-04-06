//? Importing necessary modules and models.
import { HTTP } from "../constants/httpStatus.constant.js";

//* Middleware function to require specific user roles for access.
export const requireRole =
  (roles = []) =>
  (req, res, next) => {
    const userRole = req.user?.role;
    if (!roles.includes(userRole))
      return res.status(HTTP.FORBIDDEN).json({ message: "Forbidden" });
    next();
  };
