//? Importing necessary modules and models.
import User from "../models/User.model.js";
import { hashPassword } from "../utils/hashPassword.util.js";
import cloudinary from "../config/cloudinary.config.js";

//* Helper: upload a buffer to Cloudinary via a stream.
const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });

//* Service function to get the current user's details.
export const getMe = async (userId) =>
  User.findById(userId).select("-passwordHash");

//* Service function to update the current user's details.
export const updateMe = async (userId, patch) => {
  const allowed = ["fullName", "avatarUrl"];
  const update = {};
  for (const k of allowed) if (patch[k] !== undefined) update[k] = patch[k];

  return User.findByIdAndUpdate(userId, update, { new: true }).select(
    "-passwordHash",
  );
};

//* Service function to upload a new avatar to Cloudinary and save the URL.
export const updateAvatar = async (userId, file) => {
  if (!file)
    throw Object.assign(new Error("File required"), { statusCode: 400 });

  const result = await uploadBufferToCloudinary(file.buffer, {
    folder: "collabspace/avatars",
    resource_type: "image",
    use_filename: false,
    unique_filename: true,
    overwrite: false,
  });

  return User.findByIdAndUpdate(
    userId,
    { avatarUrl: result.secure_url },
    { new: true },
  ).select("-passwordHash");
};

//* Service function to change the current user's password.
export const changePassword = async (userId, newPassword) => {
  await User.updateOne(
    { _id: userId },
    { passwordHash: await hashPassword(newPassword), passwordChangedAt: new Date() },
  );
  return { changed: true };
};
