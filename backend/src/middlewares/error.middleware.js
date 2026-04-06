//? Importing necessary modules and models.
import { HTTP } from "../constants/httpStatus.constant.js";

//* Middleware function to handle errors in the application.
export default function errorHandler(err, req, res, next) {
  console.error(err);

  //* Multer file-too-large error → 413
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File exceeds the 10 MB size limit" });
  }

  const status = err.statusCode || HTTP.SERVER_ERROR;
  res.status(status).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "development"
      ? {
          stack: err.stack,
          ...(err.meta ? { meta: err.meta } : {}),
        }
      : {}),
  });
}
