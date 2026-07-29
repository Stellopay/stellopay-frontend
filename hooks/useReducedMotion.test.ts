import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

function createMatchMedia(matches: boolean) {
  return vi.fn((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    addEventListener: vi.fn((_event: string, handler: (e: Event) => void) => {
      handler({ matches } as unknown as Event);
    }),
    removeEventListener: vi.fn(),
  }));
}

describe("useReducedMotion", () => {
  beforeEach(() => {
    window.matchMedia = createMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when the OS has no reduced-motion preference", () => {
    window.matchMedia = createMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when the OS prefers reduced motion", () => {
    window.matchMedia = createMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("reactively updates when the media query changes", () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((fn) =>
        fn({ matches: true } as MediaQueryListEvent),
      );
    });
    expect(result.current).toBe(true);

    act(() => {
      listeners.forEach((fn) =>
        fn({ matches: false } as MediaQueryListEvent),
      );
    });
    expect(result.current).toBe(false);
  });

  it("cleans up the event listener on unmount", () => {
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener,
    }));

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removeEventListener).toHaveBeenCalledOnce();
  });

  it("defaults to false during SSR (no window matchMedia)", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
