//? Importing necessary modules and models.
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { corsOptions } from "./config/cors.config.js";
import apiRoutes from "./routes/index.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";

//* Creating an Express application and applying middlewares.
const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

//* Health check endpoint and API routes.
app.get(["/health", "/api/health"], (req, res) =>
  res.json({ ok: true, name: "CollabSpace API" }),
);

//* Mounting API routes under the /api prefix.
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
