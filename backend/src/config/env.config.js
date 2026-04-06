//? Importing necessary modules and models.
import dotenv from "dotenv";
dotenv.config();

//* Function to load and validate environment variables.
export const loadEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn(`Missing env vars: ${missing.join(", ")}`);
  }
};
