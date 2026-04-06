//? CORS configuration options.
export const corsOptions = {
  origin: (origin, cb) => {
    // CORS_ORIGINS takes priority (comma-separated list for multiple origins).
    // Falls back to FRONTEND_URL as a single origin.
    const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
    const allowed = raw
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    if (!origin) return cb(null, true); // allow server-to-server / curl
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
};
