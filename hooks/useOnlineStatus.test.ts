import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOnlineStatus } from "./useOnlineStatus";

describe("useOnlineStatus", () => {
  let onlineSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onlineSpy = vi
      .spyOn(navigator, "onLine", "get")
      .mockReturnValue(true);
  });

  afterEach(() => {
    onlineSpy.mockRestore();
  });

  // ------------------------------------------------------------------
  // SSR-safe initial state
  // ------------------------------------------------------------------

  it("returns true by default (SSR-safe initial state)", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  // ------------------------------------------------------------------
  // Hydration from navigator.onLine
  // ------------------------------------------------------------------

  it("returns false when navigator.onLine is false on mount", () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("returns true when navigator.onLine is true on mount", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  // ------------------------------------------------------------------
  // Reacting to window events
  // ------------------------------------------------------------------

  it("updates to false when an offline event is dispatched", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("updates back to true when an online event follows an offline event", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("stays true when online events fire on an already-online browser", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  // ------------------------------------------------------------------
  // Cleanup
  // ------------------------------------------------------------------

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  // ------------------------------------------------------------------
  // Multiple state transitions
  // ------------------------------------------------------------------

  it("handles multiple offline → online → offline transitions", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });
});
