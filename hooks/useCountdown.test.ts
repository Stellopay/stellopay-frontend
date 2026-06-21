import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts from the requested number of seconds", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => result.current.start(3));

    expect(result.current.secondsLeft).toBe(3);
    expect(result.current.isActive).toBe(true);
  });

  it("ticks down to zero and calls onComplete once", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => result.current.start(2));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();

    act(() => vi.advanceTimersByTime(2000));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("reset cancels the active interval", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => result.current.start(5));
    act(() => result.current.reset());
    act(() => vi.advanceTimersByTime(5000));

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("starting again replaces the existing interval", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => result.current.start(5));
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.start(2));
    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.secondsLeft).toBe(0);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("uses initialSeconds when start receives no argument", () => {
    const { result } = renderHook(() => useCountdown({ initialSeconds: 4 }));

    act(() => result.current.start());

    expect(result.current.secondsLeft).toBe(4);
  });

  it("cleans up the interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { result, unmount } = renderHook(() => useCountdown());

    act(() => result.current.start(5));
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
