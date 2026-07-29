"use client";

import { useEffect, useState } from "react";

/**
 * Hook that tracks browser online/offline connectivity status.
 *
 * Behaviour
 * ---------
 * - Returns `true` by default (SSR-safe initial state).
 * - Hydrates from `navigator.onLine` on mount.
 * - Subscribes to `online` / `offline` window events and updates reactively.
 * - Cleans up event listeners on unmount.
 *
 * Usage
 * -----
 * ```tsx
 * const isOnline = useOnlineStatus();
 *
 * // Disable form submission while offline
 * <Button disabled={!isOnline}>Submit</Button>
 *
 * // Show a warning banner
 * {!isOnline && <OfflineBanner />}
 * ```
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Hydrate from the browser's actual connectivity state.
    setIsOnline(navigator.onLine);

    function handleOffline() {
      setIsOnline(false);
    }

    function handleOnline() {
      setIsOnline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOnline;
}
