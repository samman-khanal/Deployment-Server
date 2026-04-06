import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type AccentPalette = "indigo" | "violet" | "blue" | "sky" | "rose" | "emerald" | "amber" | "pink" | "teal";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  accentPalette: AccentPalette;
  setAccentPalette: (p: AccentPalette) => void;
}

const STORAGE_KEY = "collabspace_theme";
const PALETTE_KEY = "collabspace_palette";

const ThemeContext = createContext<ThemeContextType | null>(null);

/** Determine system preference */
function getSystemTheme(): "light" | "dark" {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {
      /* ignore */
    }
    return "light";
  });

  const [resolvedTheme, setResolved] = useState<"light" | "dark">(resolve(theme));

  const [accentPalette, setAccentPaletteState] = useState<AccentPalette>(() => {
    try {
      const stored = localStorage.getItem(PALETTE_KEY) as AccentPalette | null;
      const valid: AccentPalette[] = ["indigo", "violet", "blue", "sky", "rose", "emerald", "amber", "pink", "teal"];
      if (stored && valid.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    return "indigo";
  });

  // Apply class on <html>
  useEffect(() => {
    const r = resolve(theme);
    setResolved(r);
    const root = document.documentElement;
    if (r === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Apply accent palette as data-palette attribute on <html>
  useEffect(() => {
    if (accentPalette === "indigo") {
      document.documentElement.removeAttribute("data-palette");
    } else {
      document.documentElement.setAttribute("data-palette", accentPalette);
    }
  }, [accentPalette]);

  // Listen for system theme change when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const r = resolve("system");
      setResolved(r);
      if (r === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    // Also sync into the preferences blob so UserPreferences stays in sync
    try {
      const raw = localStorage.getItem("collabspace_preferences");
      if (raw) {
        const prefs = JSON.parse(raw);
        prefs.theme = t;
        localStorage.setItem("collabspace_preferences", JSON.stringify(prefs));
      }
    } catch {
      /* ignore */
    }
  };

  const setAccentPalette = (p: AccentPalette) => {
    setAccentPaletteState(p);
    localStorage.setItem(PALETTE_KEY, p);
    try {
      const raw = localStorage.getItem("collabspace_preferences");
      if (raw) {
        const prefs = JSON.parse(raw);
        prefs.accentPalette = p;
        localStorage.setItem("collabspace_preferences", JSON.stringify(prefs));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, accentPalette, setAccentPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
