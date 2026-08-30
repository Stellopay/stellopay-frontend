"use client";

import { useCallback, useRef, useState } from "react";

export interface UsePendingActionOptions {
  /** Human-readable error to show when the action rejects with no message. */
  genericErrorMessage?: string;
}

export interface UsePendingActionResult {
  /** `true` while the action is in flight (confirm button disabled/loading). */
  isPending: boolean;
  /** Message from the most recent rejected attempt, or `null` when idle. */
  error: string | null;
  /**
   * Runs `action` exactly once per confirmation. Any call made while a run is
   * still in flight is ignored, so a double click or keyboard repeat can never
   * issue the request twice.
   *
   * Resolves `true` when the action completed, `false` when it rejected
   * (in which case `error` is populated and the caller may retry).
   */
  run: (action: () => void | Promise<void>) => Promise<boolean>;
  /** Clears the stored error (e.g. when the user starts over). */
  reset: () => void;
}

/**
 * Centralizes the "one request per confirmation" guard shared by destructive
 * action dialogs.
 *
 * - The first `run` call wins; later calls before the previous run settles are
 *   no-ops (idempotent from the UI's perspective), which makes rapid double
 *   clicks and held/repeated Enter keys safe.
 * - While a run is pending, `isPending` is `true` so the caller can disable its
 *   controls and show progress.
 * - A rejected attempt leaves `error` populated and resolves `false`, letting
 *   the caller keep its dialog open and offer a retry.
 */
export function usePendingAction(
  options: UsePendingActionOptions = {},
): UsePendingActionResult {
  const { genericErrorMessage = "Something went wrong. Please try again." } =
    options;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const run = useCallback(
    async (action: () => void | Promise<void>) => {
      if (inFlightRef.current) {
        return false;
      }

      inFlightRef.current = true;
      setIsPending(true);
      setError(null);

      try {
        await action();
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error && caught.message
            ? caught.message
            : genericErrorMessage,
        );
        return false;
      } finally {
        inFlightRef.current = false;
        setIsPending(false);
      }
    },
    [genericErrorMessage],
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { isPending, error, run, reset };
}
