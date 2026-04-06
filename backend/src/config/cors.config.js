//? CORS configuration options.
export const corsOptions = {
  origin: (origin, cb) => {
    // Support comma-separated list: FRONTEND_URL=https://app.com,http://localhost:5173
    const allowed = (process.env.FRONTEND_URL || "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    if (!origin) return cb(null, true); // allow server-to-server / curl
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
};
