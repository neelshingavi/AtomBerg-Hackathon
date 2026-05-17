"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppTheme = "default" | "executive" | "boardroom" | "operational" | "accessible";

const STORAGE_KEY = "atom-theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove(
    "theme-executive",
    "theme-boardroom",
    "theme-operational",
    "theme-accessible",
    "dark"
  );
  if (theme === "executive" || theme === "boardroom") {
    root.classList.add("dark", `theme-${theme}`);
  } else if (theme === "operational") {
    root.classList.add("theme-operational");
  } else if (theme === "accessible") {
    root.classList.add("theme-accessible");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("default");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: AppTheme) => setThemeState(t), []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function useThemeOptional() {
  return useContext(ThemeContext);
}
