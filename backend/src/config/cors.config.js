//? CORS configuration options.
export const corsOptions = {
  origin: (origin, cb) => {
    const allowed = [process.env.FRONTEND_URL].filter(Boolean);
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
