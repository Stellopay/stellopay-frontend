import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

type ChangeHandler = (e: MediaQueryListEvent) => void;

function makeMql(matches: boolean) {
  let _handler: ChangeHandler | null = null;

  const mql = {
    matches,
    addEventListener: vi.fn((_: string, fn: ChangeHandler) => {
      _handler = fn;
    }),
    removeEventListener: vi.fn((_: string, fn: ChangeHandler) => {
      if (_handler === fn) _handler = null;
    }),
    // helper so tests can fire a change
    _fire(nextMatches: boolean) {
      _handler?.({ matches: nextMatches } as MediaQueryListEvent);
    },
  };

  return mql;
}

// jsdom doesn't implement matchMedia, so we assign it directly
function stubMatchMedia(mql: ReturnType<typeof makeMql>) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn(() => mql),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useReducedMotion", () => {
  it("returns false when prefers-reduced-motion does not match", () => {
    stubMatchMedia(makeMql(false));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion matches", () => {
    stubMatchMedia(makeMql(true));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the media query change event fires", () => {
    const mql = makeMql(false);
    stubMatchMedia(mql);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => mql._fire(true));
    expect(result.current).toBe(true);

    act(() => mql._fire(false));
    expect(result.current).toBe(false);
  });

  it("removes the change listener on unmount", () => {
    const mql = makeMql(false);
    stubMatchMedia(mql);

    const { unmount } = renderHook(() => useReducedMotion());
    expect(mql.addEventListener).toHaveBeenCalledOnce();

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledOnce();

    // same handler reference was passed to both calls
    const addedHandler = mql.addEventListener.mock.calls[0][1];
    const removedHandler = mql.removeEventListener.mock.calls[0][1];
    expect(addedHandler).toBe(removedHandler);
  });
});
