import http from "http";
import { loadEnv } from "./config/env.config.js";
import app from "./app.js";
import { connectDB } from "./config/db.config.js";
import { initSockets } from "./sockets/index.socket.js";
import { startCleanupJob } from "./services/messageCleanup.service.js";

loadEnv();
await connectDB();

const server = http.createServer(app);
initSockets(server, app);

//* Start message cleanup job (runs every 24 hours to delete old messages for free users)
startCleanupJob(24);

const PORT = process.env.PORT || 3000;

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other backend process (Ctrl+C) or change PORT in .env, then restart.`,
    );
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
