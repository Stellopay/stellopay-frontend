"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCountdownOptions {
  /** Called once when the countdown reaches zero. */
  onComplete?: () => void;
}

export interface UseCountdownResult {
  /** Seconds remaining. `0` when idle. */
  secondsLeft: number;
  /** `true` while the countdown is running. */
  isActive: boolean;
  /**
   * Start (or restart) a countdown for `duration` seconds.
   * Cancels any in-progress countdown before beginning the new one,
   * so rapid calls never accumulate multiple intervals.
   */
  start: (duration: number) => void;
  /** Stop the countdown immediately and reset `secondsLeft` to `0`. */
  reset: () => void;
}

/**
 * Counts down from a given number of seconds using target timestamp comparison.
 * The interval is cleared on unmount (no leak), and remaining seconds are computed
 * from Date.now() to prevent drift when tabs are backgrounded or throttled.
 *
 * @example
 * const { secondsLeft, isActive, start, reset } = useCountdown({
 *   onComplete: () => console.log("Ready to resend"),
 * });
 * // start(30) → ticks 29, 28, …, 0, then fires onComplete
 */
export function useCountdown({
  onComplete,
}: UseCountdownOptions = {}): UseCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  // Stable ref so changing onComplete never forces an interval restart.
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Guaranteed cleanup on unmount — prevents timer leaks.
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const updateCountdown = useCallback(() => {
    if (endTimeRef.current === null) return;

    const remainingMs = endTimeRef.current - Date.now();
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

    if (remainingSec <= 0) {
      clearTimer();
      endTimeRef.current = null;
      setSecondsLeft(0);
      onCompleteRef.current?.();
    } else {
      setSecondsLeft(remainingSec);
    }
  }, [clearTimer]);

  // Correct countdown immediately when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateCountdown();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateCountdown]);

  const start = useCallback(
    (duration: number) => {
      clearTimer();
      if (duration <= 0) {
        endTimeRef.current = null;
        setSecondsLeft(0);
        onCompleteRef.current?.();
        return;
      }

      endTimeRef.current = Date.now() + duration * 1000;
      setSecondsLeft(duration);

      intervalRef.current = setInterval(() => {
        updateCountdown();
      }, 1000);
    },
    [clearTimer, updateCountdown],
  );

  const reset = useCallback(() => {
    clearTimer();
    endTimeRef.current = null;
    setSecondsLeft(0);
  }, [clearTimer]);

  return {
    secondsLeft,
    isActive: secondsLeft > 0,
    start,
    reset,
  };
}

