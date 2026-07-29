/**
 * useGlobalShortcuts Hook
 *
 * Provides Gmail-style keyboard navigation shortcuts for authenticated users.
 * Supports 'g' followed by 'd' (dashboard), 't' (transactions), or 's' (settings).
 *
 * Features:
 * - Two-key chord detection with timeout window (1000ms between keypresses)
 * - Suppression when focus is in text input, textarea, or contentEditable
 * - Programmatic navigation using Next.js router
 * - Accessible and keyboard-first design
 *
 * Usage:
 *   useGlobalShortcuts();  // Wire in app layout component
 *
 * WCAG 2.1 AA Compliance:
 * - 2.1.1 Keyboard: All navigation accessible via keyboard
 * - 2.1.2 No Keyboard Trap: Users can escape shortcuts and continue using keyboard
 * - 2.4.8 Focus Visible: Focus indicators visible when cycling through shortcuts
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Configuration for keyboard shortcuts
 */
interface ShortcutConfig {
  /**
   * The second key to press after 'g'
   */
  key: "d" | "t" | "s";
  /**
   * The route to navigate to
   */
  route: string;
  /**
   * Human-readable description for debugging/logging
   */
  description: string;
}

/**
 * Available keyboard shortcuts
 */
const SHORTCUTS: Record<string, ShortcutConfig> = {
  d: {
    key: "d",
    route: "/dashboard",
    description: "Go to Dashboard",
  },
  t: {
    key: "t",
    route: "/transactions",
    description: "Go to Transactions",
  },
  s: {
    key: "s",
    route: "/settings/preferences",
    description: "Go to Settings",
  },
};

/**
 * Timeout window for the second keypress (in milliseconds)
 * If user doesn't press the second key within this time, the sequence is reset
 */
const CHORD_TIMEOUT_MS = 1000;

/**
 * Checks if the current active element is a text input
 * Returns true if focus is on an input that shouldn't trigger shortcuts
 */
function isTextInputFocused(): boolean {
  const activeElement = document.activeElement as HTMLElement;

  // Null or body element means nothing is focused
  if (!activeElement || activeElement === document.body) {
    return false;
  }

  // Check for input elements
  if (
    activeElement instanceof HTMLInputElement &&
    activeElement.type !== "button" &&
    activeElement.type !== "submit" &&
    activeElement.type !== "reset" &&
    activeElement.type !== "checkbox" &&
    activeElement.type !== "radio"
  ) {
    return true;
  }

  // Check for textarea elements
  if (activeElement instanceof HTMLTextAreaElement) {
    return true;
  }

  // Check for contentEditable elements
  if (
    activeElement.contentEditable === "true" ||
    activeElement.contentEditable === "plaintext-only"
  ) {
    return true;
  }

  // Check if activeElement is inside a contentEditable or input
  let current = activeElement.parentElement;
  while (current) {
    if (current instanceof HTMLTextAreaElement) {
      return true;
    }
    if (
      current.contentEditable === "true" ||
      current.contentEditable === "plaintext-only"
    ) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

/**
 * Hook for Gmail-style keyboard navigation shortcuts
 *
 * Listens for the 'g' key followed by 'd', 't', or 's' within a timeout window.
 * Navigates to the corresponding route when the full chord is detected.
 *
 * Does not activate if focus is on a text input, textarea, or contentEditable element.
 *
 * @example
 * ```typescript
 * // In app-layout.tsx
 * export default function AppLayout({ children }: AppLayoutProps) {
 *   useGlobalShortcuts();
 *   // ... rest of component
 * }
 * ```
 */
export function useGlobalShortcuts(): void {
  const router = useRouter();
  const firstKeyPressedRef = useRef<boolean>(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    /**
     * Handles keydown events for shortcut detection
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't activate shortcuts if focus is on a text input
      if (isTextInputFocused()) {
        return;
      }

      // Only handle lowercase 'g', 'd', 't', 's' keys (case-insensitive)
      const key = event.key.toLowerCase();

      if (key === "g") {
        // Prevent default browser behavior for 'g' key
        // (some browsers use 'g' for find-next in reader mode)
        event.preventDefault();

        // If first key wasn't pressed yet, mark it as pressed
        if (!firstKeyPressedRef.current) {
          firstKeyPressedRef.current = true;

          // Set a timeout to reset the first key state if second key isn't pressed in time
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
          }

          timeoutIdRef.current = setTimeout(() => {
            firstKeyPressedRef.current = false;
            timeoutIdRef.current = null;
          }, CHORD_TIMEOUT_MS);
        } else {
          // If 'g' is pressed twice in a row, reset and wait for new sequence
          firstKeyPressedRef.current = true;

          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
          }

          timeoutIdRef.current = setTimeout(() => {
            firstKeyPressedRef.current = false;
            timeoutIdRef.current = null;
          }, CHORD_TIMEOUT_MS);
        }
      } else if (firstKeyPressedRef.current && (key === "d" || key === "t" || key === "s")) {
        // Second key in chord detected
        event.preventDefault();

        // Reset the first key state
        firstKeyPressedRef.current = false;

        // Clear the timeout
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // Get the shortcut config
        const shortcut = SHORTCUTS[key];
        if (shortcut) {
          // Navigate to the route
          router.push(shortcut.route);
        }
      } else if (firstKeyPressedRef.current && key !== "g") {
        // Any other key pressed after 'g' resets the chord
        firstKeyPressedRef.current = false;

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [router]);
}

/**
 * Export shortcut config for documentation/testing
 */
export { SHORTCUTS, CHORD_TIMEOUT_MS };
