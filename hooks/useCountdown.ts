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
 * Counts down from a given number of seconds using a single `setInterval`.
 * The interval is cleared on unmount (no leak), and re-renders never restart
 * the timer, so a cooldown survives component state changes.
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

  const start = useCallback(
    (duration: number) => {
      clearTimer();
      setSecondsLeft(duration);

      // Local variable tracks remaining time inside the closure so the
      // interval does not depend on React state reads.
      let remaining = duration;
      intervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setSecondsLeft(0);
          onCompleteRef.current?.();
        } else {
          setSecondsLeft(remaining);
        }
      }, 1000);
    },
    [clearTimer],
  );

  const reset = useCallback(() => {
    clearTimer();
    setSecondsLeft(0);
  }, [clearTimer]);

  return {
    secondsLeft,
    isActive: secondsLeft > 0,
    start,
    reset,
  };
}
