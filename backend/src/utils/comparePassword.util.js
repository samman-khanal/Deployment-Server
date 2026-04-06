//? Importing necessary modules and models.
import bcrypt from "bcryptjs";

//* Utility function to compare plain text password with hashed password.
export const comparePassword = async (plain, hash) =>
  bcrypt.compare(plain, hash);
