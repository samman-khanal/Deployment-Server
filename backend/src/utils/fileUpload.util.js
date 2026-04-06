//? Importing necessary modules and models.
import multer from "multer";

//* Utility function to configure multer for file uploads with memory storage and size limit.
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, //* Filesize limit is set to 10MB
});
