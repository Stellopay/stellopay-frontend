import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with secondsLeft=0 and isActive=false", () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("start sets secondsLeft and marks isActive=true", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(5);
    });

    expect(result.current.secondsLeft).toBe(5);
    expect(result.current.isActive).toBe(true);
  });

  it("decrements secondsLeft by 1 each second", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(3);
    });

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(1);
  });

  it("reaches 0 and calls onComplete when countdown ends", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start(2);
    });

    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("does not call onComplete more than once after the interval ends", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start(1);
    });

    act(() => vi.advanceTimersByTime(10_000));

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("completion works without an onComplete callback", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(1);
    });

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("reset stops the countdown and sets secondsLeft to 0", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(10);
    });

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(7);

    act(() => {
      result.current.reset();
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);

    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.secondsLeft).toBe(0);
  });

  it("reset does not trigger onComplete", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start(10);
    });

    act(() => {
      result.current.reset();
    });

    act(() => vi.advanceTimersByTime(15_000));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("reset is safe to call when no countdown is running", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.reset();
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("calling start again cancels the previous countdown", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start(30);
    });

    act(() => vi.advanceTimersByTime(5000));

    act(() => {
      result.current.start(3);
    });

    expect(result.current.secondsLeft).toBe(3);

    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("clears the interval on unmount and does not call onComplete", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { result, unmount } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start(5);
    });

    unmount();

    act(() => vi.advanceTimersByTime(10_000));

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("re-renders do not reset an active countdown", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(10);
    });

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(7);

    rerender();

    expect(result.current.secondsLeft).toBe(7);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(5);
  });

  it("recomputes remaining seconds immediately on visibilitychange when tab regains focus after background drift", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(10);
    });

    expect(result.current.secondsLeft).toBe(10);

    // Simulate tab backgrounding: system time jumps forward 6 seconds without interval ticks
    act(() => {
      vi.setSystemTime(Date.now() + 6000);
    });

    expect(result.current.secondsLeft).toBe(10); // Not updated prior to visibilitychange / interval tick

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.secondsLeft).toBe(4);
    expect(result.current.isActive).toBe(true);
  });

  it("triggers onComplete on visibilitychange if countdown expired while tab was backgrounded", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start(5);
    });

    // Advance time past countdown end without firing intervals (simulating background throttling)
    act(() => {
      vi.setSystemTime(Date.now() + 10_000);
    });

    expect(result.current.secondsLeft).toBe(5);

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("ignores visibilitychange when document visibilityState is hidden", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      vi.setSystemTime(Date.now() + 5000);
    });

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.secondsLeft).toBe(10);
  });

  it("does nothing on visibilitychange when no countdown is active", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("handles start with duration <= 0 immediately", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ onComplete }));

    act(() => {
      result.current.start(0);
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
  });
});


