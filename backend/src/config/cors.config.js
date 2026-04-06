//? CORS configuration options.
const getAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
};

// Log allowed origins at startup so Render logs show the actual value being used.
console.log("[CORS] Allowed origins:", getAllowedOrigins());

export const corsOptions = {
  origin: (origin, cb) => {
    const allowed = getAllowedOrigins();
    if (!origin) return cb(null, true); // allow server-to-server / curl
    if (allowed.length === 0) return cb(null, true); // no restriction configured — allow all
    if (allowed.includes(origin)) return cb(null, true);
    console.warn(`[CORS] Blocked origin: "${origin}". Allowed: ${allowed.join(", ")}`);
    return cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
};
