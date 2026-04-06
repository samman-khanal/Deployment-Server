//? Importing necessary modules and models.
import { HTTP } from "../constants/httpStatus.constant.js";

//* Middleware function to handle 404 Not Found errors.
export default function notFound(req, res) {
  res.status(HTTP.NOT_FOUND).json({
    message: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
}
