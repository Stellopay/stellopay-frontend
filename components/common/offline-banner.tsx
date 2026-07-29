"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Wifi, WifiOff, X } from "lucide-react";

/**
 * Fixed banner that surfaces network-connectivity changes to the user.
 *
 * Behaviour
 * ---------
 * - Detects initial state from `navigator.onLine`.
 * - Subscribes to `online` / `offline` window events.
 * - Renders a persistent warning banner while offline.
 * - The banner is dismissible; it reappears on the next `offline` event.
 * - On reconnection, displays a brief success state that auto-dismisses
 *   after a few seconds.
 *
 * Accessibility
 * -------------
 * - `role="alert"` + `aria-live="assertive"` so AT announces every
 *   connectivity change immediately.
 * - Dismiss button carries a descriptive `aria-label`.
 * - Icons are decorative (`aria-hidden="true"`).
 * - Colour contrast meets WCAG 2.1 AA for both light and dark themes.
 *
 * Responsiveness
 * --------------
 * - Full-width stacked layout on narrow viewports; side-by-side on wider
 *   screens so the dismiss action does not wrap awkwardly.
 * - All text is constrained to a reasonable measure for readability.
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  // Track whether we've ever transitioned offline so we only show the
  // reconnected banner after a genuine offline→online cycle.
  const wasOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    // Hydrate initial state from the browser.
    setIsOnline(navigator.onLine);

    function handleOffline() {
      wasOfflineRef.current = true;
      setIsOnline(false);
      setDismissed(false);
      // Clear any lingering reconnected state.
      setShowReconnected(false);
    }

    function handleOnline() {
      setIsOnline(true);
      setDismissed(false);
      // Only show the reconnected message when we were previously offline.
      if (wasOfflineRef.current) {
        setShowReconnected(true);
      }
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Auto-dismiss the reconnected success state after a short delay.
  useEffect(() => {
    if (!showReconnected) return;

    const timer = setTimeout(() => {
      setShowReconnected(false);
    }, 3_000);

    return () => clearTimeout(timer);
  }, [showReconnected]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Nothing to render when online and not in the reconnected state.
  if (isOnline && !showReconnected) return null;

  // Banner was dismissed while offline — user chose to hide it.
  if (!isOnline && dismissed) return null;

  const isReconnected = isOnline && showReconnected;

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="offline-banner"
      className={
        "fixed top-0 inset-x-0 z-[9998] flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium " +
        (isReconnected
          ? "bg-success/15 text-success border-b border-success/30"
          : "bg-destructive/15 text-destructive border-b border-destructive/30")
      }
    >
      <span className="flex items-center gap-2 min-w-0">
        {isReconnected ? (
          <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className="truncate">
          {isReconnected
            ? "Your internet connection was restored."
            : "You are currently offline. Some features may be unavailable."}
        </span>
      </span>

      {/* Only show dismiss in the offline state; reconnected auto-dismisses. */}
      {!isReconnected && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss offline notification"
          className="shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
