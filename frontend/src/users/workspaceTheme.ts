export type AvatarTheme = {
  fromClass: string;
  toClass: string;
  fromHex: string;
  toHex: string;
  accentHex: string;
  dots: [string, string];
};

const AVATAR_THEMES: readonly AvatarTheme[] = [
  {
    fromClass: "from-indigo-600",
    toClass: "to-fuchsia-500",
    fromHex: "#4f46e5",
    toHex: "#d946ef",
    accentHex: "#06b6d4",
    dots: ["bg-indigo-400", "bg-fuchsia-400"],
  },
  {
    fromClass: "from-sky-600",
    toClass: "to-indigo-600",
    fromHex: "#0284c7",
    toHex: "#4f46e5",
    accentHex: "#22c55e",
    dots: ["bg-sky-400", "bg-indigo-400"],
  },
  {
    fromClass: "from-emerald-600",
    toClass: "to-teal-500",
    fromHex: "#059669",
    toHex: "#14b8a6",
    accentHex: "#60a5fa",
    dots: ["bg-emerald-400", "bg-teal-400"],
  },
  {
    fromClass: "from-violet-600",
    toClass: "to-sky-500",
    fromHex: "#7c3aed",
    toHex: "#0ea5e9",
    accentHex: "#f59e0b",
    dots: ["bg-violet-400", "bg-sky-400"],
  },
  {
    fromClass: "from-rose-600",
    toClass: "to-orange-500",
    fromHex: "#e11d48",
    toHex: "#f97316",
    accentHex: "#8b5cf6",
    dots: ["bg-rose-400", "bg-orange-400"],
  },
  {
    fromClass: "from-amber-500",
    toClass: "to-rose-500",
    fromHex: "#f59e0b",
    toHex: "#f43f5e",
    accentHex: "#06b6d4",
    dots: ["bg-amber-300", "bg-rose-400"],
  },
];

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "WS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const pickThemeIndex = (key: string) => {
  const compact = key.replaceAll("-", "");
  const looksLikeHex = /^[0-9a-fA-F]+$/.test(compact);

  if (looksLikeHex && compact.length >= 2) {
    const lastTwo = compact.slice(-2);
    const value = Number.parseInt(lastTwo, 16);
    if (!Number.isNaN(value)) return value % AVATAR_THEMES.length;
  }

  return hashString(key) % AVATAR_THEMES.length;
};

export const getAvatarTheme = (key: string): AvatarTheme =>
  AVATAR_THEMES[pickThemeIndex(key)];
