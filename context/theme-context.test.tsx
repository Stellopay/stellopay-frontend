/**
 * @file context/theme-context.test.tsx
 * @description Unit tests for ThemeProvider and the useTheme hook.
 * Covers theme hydration, prefers-color-scheme system fallbacks, theme toggling,
 * class list additions/removals on document.documentElement, and safe error boundary handling.
 */

import React from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import { safeStorage } from "@/utils/safeStorage";

// Mock the safeStorage utility module to control return values and spy on calls
vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("ThemeProvider & useTheme", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear all classes on the root element
    document.documentElement.className = "";
    
    // Reset matchMedia to undefined by default to test fallbacks clean
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  /**
   * Helper to mock window.matchMedia behavior.
   * @param matches Whether the system preference matches the query.
   */
  const setupMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  describe("Hydration", () => {
    it("hydrates 'dark' theme from storage if set", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue("dark");

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(safeStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    it("hydrates 'light' theme from storage if set", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(safeStorage.setItem).toHaveBeenCalledWith("theme", "light");
    });
  });

  describe("System Preference Fallback", () => {
    it("falls back to system dark preference if nothing is in storage", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue(null);
      setupMatchMedia(true);

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(safeStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    it("falls back to system light preference if system preference is light", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue(null);
      setupMatchMedia(false);

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(safeStorage.setItem).toHaveBeenCalledWith("theme", "light");
    });

    it("falls back to 'light' theme when window.matchMedia is undefined", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue(null);

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(safeStorage.setItem).toHaveBeenCalledWith("theme", "light");
    });
  });

  describe("Security and Robustness", () => {
    it("falls back to system preference if the stored value is invalid or hostile", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue("hostile-payload-value");
      setupMatchMedia(true);

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(safeStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    it("survives and defaults safely when safeStorage.getItem throws an error", () => {
      vi.mocked(safeStorage.getItem).mockImplementation(() => {
        throw new Error("Storage blocked");
      });
      setupMatchMedia(false);

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("survives and functions normally when safeStorage.setItem throws an error", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue("dark");
      vi.mocked(safeStorage.setItem).mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("survives when document.documentElement.classList.add throws an error", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue("light");
      const { result } = renderHook(() => useTheme(), { wrapper });

      const originalAdd = document.documentElement.classList.add;
      document.documentElement.classList.add = vi.fn().mockImplementation(() => {
        throw new Error("DOM manipulation error");
      });

      try {
        act(() => {
          result.current.setTheme("dark");
        });
        // Verify state is still updated even if the DOM class modification fails
        expect(result.current.theme).toBe("dark");
      } finally {
        document.documentElement.classList.add = originalAdd;
      }
    });
  });

  describe("API Controls", () => {
    it("toggles the theme between dark and light", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe("light");

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(safeStorage.setItem).toHaveBeenLastCalledWith("theme", "dark");

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(safeStorage.setItem).toHaveBeenLastCalledWith("theme", "light");
    });

    it("sets the theme explicitly using setTheme", () => {
      vi.mocked(safeStorage.getItem).mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe("light");

      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(safeStorage.setItem).toHaveBeenLastCalledWith("theme", "dark");

      act(() => {
        result.current.setTheme("light");
      });

      expect(result.current.theme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(safeStorage.setItem).toHaveBeenLastCalledWith("theme", "light");
    });
  });

  describe("Context Verification", () => {
    it("throws a clear error when useTheme is called outside ThemeProvider", () => {
      expect(() => renderHook(() => useTheme())).toThrow(
        "useTheme must be used within ThemeProvider",
      );
    });
  });
});
