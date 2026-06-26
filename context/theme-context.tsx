"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { safeStorage } from "@/utils/safeStorage";

type Theme = "light" | "dark";

/**
 * Safely resolves the stored theme from localStorage or system preference.
 * This is used post-hydration to initialize the theme state correctly.
 * 
 * @returns The resolved theme: "dark" or "light".
 */
export function getStoredTheme(): Theme {
  try {
    const stored = safeStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  } catch (e) {
    return "light";
  }
}

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("light");

  // On mount, resolve the theme from storage/prefers-color-scheme
  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  // Update document class and persist theme when it changes
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      safeStorage.setItem("theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));
  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
