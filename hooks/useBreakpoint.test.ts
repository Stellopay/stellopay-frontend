import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useBreakpoint, useIsMobile, BREAKPOINTS } from "./useBreakpoint";

describe("useBreakpoint", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Default to a desktop-like width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1440,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns desktop state by default at 1440px", () => {
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.width).toBe(1440);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isSm).toBe(false);
    expect(result.current.activeBreakpoint).toBe("xl");
  });

  it("detects mobile below the md breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: BREAKPOINTS.md - 1,
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("detects mobile at very small widths", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 320,
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isSm).toBe(true);
    expect(result.current.activeBreakpoint).toBe("sm");
  });

  it("detects tablet widths (md to just below lg)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: BREAKPOINTS.lg - 1,
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("updates state on window resize", () => {
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.width).toBe(1440);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.width).toBe(375);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("uses passive resize listener", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useBreakpoint());

    // Find the resize call
    const resizeCall = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "resize",
    );
    expect(resizeCall).toBeDefined();
    // Third argument should be an options object with passive: true
    expect(resizeCall![2]).toEqual({ passive: true });

    addEventListenerSpy.mockRestore();
  });

  it("cleans up resize listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useBreakpoint());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });
});

describe("useIsMobile", () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns true when width is below md breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when width is at or above md breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: BREAKPOINTS.md,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
