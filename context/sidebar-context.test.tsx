/**
 * Unit tests for SidebarProvider and useSidebar hook.
 *
 * Coverage targets:
 *  - Hydration from safeStorage ("true" / "false" / null / malformed)
 *  - isMobile toggling across the 768 px breakpoint via resize events
 *  - Persistence to safeStorage on open/close
 *  - Resize listener cleanup on unmount
 *  - useSidebar throws outside a provider
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { SidebarProvider } from "@/context/sidebar-context";
import { safeStorage } from "@/utils/safeStorage";

// ── helpers ────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

function fireResize() {
  window.dispatchEvent(new Event("resize"));
}

// ── tests ──────────────────────────────────────────────────────────────────

// Import the hook after mocking so modules resolve correctly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: useSidebar } = await import("@/context/sidebar-context");

describe("SidebarProvider – hydration", () => {
  beforeEach(() => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue(null);
    vi.spyOn(safeStorage, "setItem").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates isSidebarOpen as true when storage returns "true"', () => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue("true");

    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it('hydrates isSidebarOpen as false when storage returns "false"', () => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue("false");

    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("keeps default (true) when storage returns null", () => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue(null);

    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("keeps default (true) when storage returns a malformed value", () => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue("malformed-value");

    const { result } = renderHook(() => useSidebar(), { wrapper });
    // "malformed-value" !== "true" → treated as false by the === comparison
    expect(result.current.isSidebarOpen).toBe(false);
  });
});

describe("SidebarProvider – isMobile / resize", () => {
  beforeEach(() => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue(null);
    vi.spyOn(safeStorage, "setItem").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets isMobile true when innerWidth < 768", () => {
    setWidth(375);
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isMobile).toBe(true);
  });

  it("sets isMobile false when innerWidth >= 768", () => {
    setWidth(1024);
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isMobile).toBe(false);
  });

  it("sets isMobile false at exactly 768 (boundary)", () => {
    setWidth(768);
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isMobile).toBe(false);
  });

  it("updates isMobile to true when resize event fires below 768", () => {
    setWidth(1024);
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isMobile).toBe(false);

    act(() => {
      setWidth(375);
      fireResize();
    });

    expect(result.current.isMobile).toBe(true);
  });

  it("updates isMobile to false when resize event fires at/above 768", () => {
    setWidth(375);
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isMobile).toBe(true);

    act(() => {
      setWidth(1200);
      fireResize();
    });

    expect(result.current.isMobile).toBe(false);
  });
});

describe("SidebarProvider – persistence", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists 'false' to storage when sidebar is closed", () => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue(null);
    const setItemSpy = vi
      .spyOn(safeStorage, "setItem")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useSidebar(), { wrapper });

    act(() => {
      result.current.setSidebarOpen(false);
    });

    expect(setItemSpy).toHaveBeenCalledWith("sidebarOpen", "false");
  });

  it("persists 'true' to storage when sidebar is opened", () => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue("false");
    const setItemSpy = vi
      .spyOn(safeStorage, "setItem")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useSidebar(), { wrapper });

    act(() => {
      result.current.setSidebarOpen(true);
    });

    expect(setItemSpy).toHaveBeenCalledWith("sidebarOpen", "true");
  });
});

describe("SidebarProvider – resize listener cleanup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes the resize listener on unmount", () => {
    vi.spyOn(safeStorage, "getItem").mockReturnValue(null);
    vi.spyOn(safeStorage, "setItem").mockImplementation(() => {});

    const removeListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useSidebar(), { wrapper });
    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
  });
});

describe("useSidebar outside provider", () => {
  it("throws a descriptive error", () => {
    expect(() => renderHook(() => useSidebar())).toThrow(
      /useSidebar must be used within a SidebarProvider/,
    );
  });
});
