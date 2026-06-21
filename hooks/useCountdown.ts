"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  initialSeconds?: number;
  onComplete?: () => void;
}

/**
 * Reusable countdown timer for rate-limited UI actions.
 * Keeps a single interval alive, cleans it up on unmount, and fires
 * `onComplete` exactly when the timer reaches zero.
 */
export function useCountdown({
  initialSeconds = 0,
  onComplete,
}: UseCountdownOptions = {}) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor(initialSeconds)),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(
    (nextSeconds = 0) => {
      clearCountdown();
      setSecondsLeft(Math.max(0, Math.floor(nextSeconds)));
    },
    [clearCountdown],
  );

  const start = useCallback(
    (nextSeconds = initialSeconds) => {
      const duration = Math.max(0, Math.floor(nextSeconds));
      clearCountdown();
      setSecondsLeft(duration);

      if (duration === 0) {
        onCompleteRef.current?.();
        return;
      }

      intervalRef.current = setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            clearCountdown();
            onCompleteRef.current?.();
            return 0;
          }

          return current - 1;
        });
      }, 1000);
    },
    [clearCountdown, initialSeconds],
  );

  useEffect(() => clearCountdown, [clearCountdown]);

  return {
    secondsLeft,
    isActive: secondsLeft > 0,
    start,
    reset,
  };
}
