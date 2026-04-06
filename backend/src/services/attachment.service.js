//? Importing necessary modules and models.
import Attachment from "../models/Attachment.model.js";
import cloudinary from "../config/cloudinary.config.js";

//* Helper: upload a file buffer to Cloudinary and return the result.
const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });

//* Determine the Cloudinary resource_type from a MIME type.
const resourceType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw"; // documents, PDFs, etc.
};

//* Service function to upload a new attachment to a task.
export const uploadAttachment = async ({ taskId, userId, file }) => {
  if (!file)
    throw Object.assign(new Error("File required"), { statusCode: 400 });

  const result = await uploadBufferToCloudinary(file.buffer, {
    folder: "collabspace/attachments",
    resource_type: resourceType(file.mimetype),
    use_filename: true,
    unique_filename: true,
  });

  return Attachment.create({
    task: taskId,
    uploadedBy: userId,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: result.secure_url,
    publicId: result.public_id,
  });
};

//* Service function to list all attachments for a task.
export const listAttachments = async (taskId) =>
  Attachment.find({ task: taskId }).sort({ createdAt: -1 });

//* Service function to delete an attachment by its ID.
export const deleteAttachment = async (attachmentId, userId) => {
  const a = await Attachment.findById(attachmentId);
  if (!a)
    throw Object.assign(new Error("Attachment not found"), { statusCode: 404 });
  if (String(a.uploadedBy) !== String(userId))
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

  await cloudinary.uploader.destroy(a.publicId, {
    resource_type: resourceType(a.mimeType),
  });
  await Attachment.deleteOne({ _id: attachmentId });
  return { deleted: true };
};
