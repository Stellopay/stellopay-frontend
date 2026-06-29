import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { ThemeProvider, useTheme, getStoredTheme } from "@/context/theme-context";
import { safeStorage } from "@/utils/safeStorage";

// ---------------------------------------------------------------------------
// matchMedia mock helpers
// ---------------------------------------------------------------------------

type MqlListener = (e: MediaQueryListEvent) => void;

interface MockMql {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  _listeners: MqlListener[];
  _fire: (matches: boolean) => void;
}

function createMockMql(prefersDark: boolean): MockMql {
  const listeners: MqlListener[] = [];

  const mql: MockMql = {
    matches: prefersDark,
    addEventListener: vi.fn((_event: string, cb: MqlListener) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn((_event: string, cb: MqlListener) => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    _listeners: listeners,
    _fire(newMatches: boolean) {
      mql.matches = newMatches;
      listeners.forEach((cb) =>
        cb({ matches: newMatches } as MediaQueryListEvent),
      );
    },
  };

  return mql;
}

function installMatchMedia(prefersDark: boolean): MockMql {
  const mql = createMockMql(prefersDark);
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => mql),
  });
  return mql;
}

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ThemeProvider – light mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installMatchMedia(false);
    window.localStorage.setItem("theme", "light");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("reads 'light' from storage and resolves to light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("does not add 'dark' class to <html> in light mode", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggleTheme cycles light → dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
  });
});

// ---------------------------------------------------------------------------

describe("ThemeProvider – dark mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installMatchMedia(false);
    window.localStorage.setItem("theme", "dark");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("reads 'dark' from storage and resolves to dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("adds 'dark' class to <html>", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggleTheme cycles dark → system", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("system");
  });
});

// ---------------------------------------------------------------------------

describe("ThemeProvider – system mode (OS prefers dark)", () => {
  let mql: MockMql;

  beforeEach(() => {
    window.localStorage.clear();
    mql = installMatchMedia(true); // OS = dark
    window.localStorage.setItem("theme", "system");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("resolves to dark when OS prefers dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("adds 'dark' class when OS prefers dark", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("registers a matchMedia change listener", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("updates resolvedTheme live when OS switches to light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolvedTheme).toBe("dark");

    act(() => mql._fire(false)); // OS switches to light

    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("updates resolvedTheme live when OS switches back to dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => mql._fire(false)); // → light
    act(() => mql._fire(true));  // → dark again

    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggleTheme cycles system → light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
  });
});

// ---------------------------------------------------------------------------

describe("ThemeProvider – system mode (OS prefers light)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installMatchMedia(false); // OS = light
    window.localStorage.setItem("theme", "system");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("resolves to light when OS prefers light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("does not add 'dark' class when OS prefers light", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe("ThemeProvider – matchMedia listener cleanup", () => {
  let mql: MockMql;

  beforeEach(() => {
    window.localStorage.clear();
    mql = installMatchMedia(true);
    window.localStorage.setItem("theme", "system");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("removes the matchMedia listener on unmount", () => {
    const { unmount } = renderHook(() => useTheme(), { wrapper });
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("removes the listener when switching away from system mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setTheme("light")); // no longer system

    // Listener should have been removed (effect re-ran without re-registering).
    expect(mql.removeEventListener).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe("ThemeProvider – setTheme API", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installMatchMedia(false);
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("setTheme('dark') applies dark class and persists", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  it("setTheme('light') removes dark class and persists", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("dark"));
    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("theme")).toBe("light");
  });

  it("setTheme('system') persists 'system' to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("system"));
    expect(result.current.theme).toBe("system");
    expect(window.localStorage.getItem("theme")).toBe("system");
  });
});

// ---------------------------------------------------------------------------

describe("ThemeProvider – security: invalid localStorage values", () => {
  beforeEach(() => {
    installMatchMedia(false);
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("falls back to 'system' when localStorage holds an unknown value", () => {
    window.localStorage.setItem("theme", "hacker-value");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
  });

  it("falls back to 'system' when localStorage value is empty", () => {
    window.localStorage.setItem("theme", "");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
  });

  it("falls back to 'system' when no value is stored", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
  });
});

// ---------------------------------------------------------------------------

describe("useTheme outside provider", () => {
  it("throws a clear error", () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      /useTheme must be used within ThemeProvider/,
    );
  });
});

// ---------------------------------------------------------------------------

describe("ThemeProvider – system mode, matchMedia unavailable", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("theme", "system");
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it("resolves to 'light' when matchMedia is unavailable (SSR fallback)", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("does not add 'dark' class when matchMedia is unavailable", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("does not register a listener when matchMedia is unavailable", () => {
    // Should not throw; listener setup is skipped when matchMedia is absent.
    expect(() => renderHook(() => useTheme(), { wrapper })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------

describe("getStoredTheme – storage error handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("returns 'system' when safeStorage.getItem throws unexpectedly", () => {
    vi.spyOn(safeStorage, "getItem").mockImplementationOnce(() => {
      throw new Error("simulated unexpected storage error");
    });
    expect(getStoredTheme()).toBe("system");
  });
});
