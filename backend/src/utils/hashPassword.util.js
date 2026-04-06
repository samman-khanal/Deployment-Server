//? Importing necessary modules and models.
import bcrypt from "bcryptjs";

//* Utility function to hash a plain text password.
export const hashPassword = async (plain) => bcrypt.hash(plain, 10);
