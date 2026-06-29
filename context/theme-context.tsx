"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { safeStorage } from "@/utils/safeStorage";

/**
 * The user's explicit theme preference.
 *
 * - `"light"` – always use light mode.
 * - `"dark"`  – always use dark mode.
 * - `"system"` – mirror the OS/browser `prefers-color-scheme` setting and
 *   update live whenever it changes.
 */
export type Theme = "light" | "dark" | "system";

/**
 * The concrete theme actually applied to the document (`"light"` or `"dark"`).
 * When the preference is `"system"` this reflects the current OS preference
 * rather than the stored value.
 */
export type ResolvedTheme = "light" | "dark";

/** Set of valid stored values. Anything else is rejected and falls back to `"system"`. */
const VALID_THEMES = new Set<Theme>(["light", "dark", "system"]);

function isValidTheme(value: unknown): value is Theme {
  return typeof value === "string" && VALID_THEMES.has(value as Theme);
}

function getSystemPreference(): ResolvedTheme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

function resolveTheme(preference: Theme): ResolvedTheme {
  if (preference === "system") return getSystemPreference();
  return preference;
}

/**
 * Safely reads the user's stored theme preference from localStorage.
 * Only known values (`"light"`, `"dark"`, `"system"`) are accepted; anything
 * else (missing, empty, or hostile) falls back to `"system"` so the OS
 * preference drives the UI. Used to initialize state in sync with the
 * pre-hydration FOUC script in the root layout.
 *
 * @returns The stored theme preference, or `"system"` as a safe default.
 */
export function getStoredTheme(): Theme {
  try {
    const stored = safeStorage.getItem("theme");
    return isValidTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

type ThemeContextValue = {
  /**
   * The user's stored preference (`"light"`, `"dark"`, or `"system"`).
   * Persist this value to localStorage; do not use it to drive CSS classes.
   */
  theme: Theme;
  /**
   * The concrete theme class applied to `<html>` (`"light"` or `"dark"`).
   * Use this for any UI that needs to know the actual visible theme.
   */
  resolvedTheme: ResolvedTheme;
  /** Cycles: light → dark → system → light … */
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Hydrate preference from storage on mount.
  useEffect(() => {
    try {
      // Reuse the same resolution used by the pre-hydration FOUC script so the
      // React state matches the class already applied to <html>.
      const preference = getStoredTheme();
      setThemeState(preference);
      setResolvedTheme(resolveTheme(preference));
    } catch {
      // Storage unavailable – keep defaults.
    }
  }, []);

  // Apply the resolved class to <html> and subscribe to OS changes when in
  // "system" mode.
  useEffect(() => {
    const root = document.documentElement;

    function applyResolved(resolved: ResolvedTheme) {
      if (resolved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      setResolvedTheme(resolved);
    }

    // Apply immediately.
    applyResolved(resolveTheme(theme));

    // Persist the preference (including "system").
    try {
      safeStorage.setItem("theme", theme);
    } catch {
      // Ignore quota / privacy errors.
    }

    if (theme !== "system") {
      // Not in system mode – no listener needed.
      return;
    }

    // Guard: matchMedia may be absent in test stubs or non-standard environments.
    if (!window.matchMedia) return;

    // Subscribe to live OS preference changes.
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      applyResolved(e.matches ? "dark" : "light");
    };

    mql.addEventListener("change", handleChange);
    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, [theme]);

  /** Cycles light → dark → system → light */
  const toggleTheme = () =>
    setThemeState((t) => {
      if (t === "light") return "dark";
      if (t === "dark") return "system";
      return "light";
    });

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
