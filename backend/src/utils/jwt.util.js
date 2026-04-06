//? Importing necessary modules and models.
import jwt from "jsonwebtoken";

//* Utility function to sign a JWT access token with a given payload.
export const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

//* Utility function to verify a JWT token and return the decoded payload.
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
