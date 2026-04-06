//? Importing necessary modules and models.
import crypto from "crypto";

//* Utility function to generate a random token.
export const generateToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");
