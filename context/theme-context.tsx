"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { safeStorage } from "@/utils/safeStorage";

type ResolvedTheme = "light" | "dark";
type Theme = ResolvedTheme | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";
const THEME_QUERY = "(prefers-color-scheme: dark)";

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark" || value === "system";

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(THEME_QUERY).matches ? "dark" : "light";
};

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = safeStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(THEME_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener?.("change", handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  /**
   * `theme` is the persisted user preference; `resolvedTheme` is the concrete
   * class applied to the document.
   */
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      safeStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }, [resolvedTheme, theme]);

  const toggleTheme = useCallback(() =>
    setThemeState((t) => {
      if (t === "light") return "dark";
      if (t === "dark") return "system";
      return "light";
    }), []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, toggleTheme, setTheme }),
    [theme, resolvedTheme, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
