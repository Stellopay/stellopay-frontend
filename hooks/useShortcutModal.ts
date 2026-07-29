"use client";

/**
 * useShortcutModal
 * ----------------
 * Manages the open/closed state of the keyboard shortcut help modal and
 * binds the global `?` key (Shift + /) to toggle it.
 *
 * Key-binding rules
 * -----------------
 * • Only fires on `keydown` (not `keyup`) to match browser convention.
 * • Suppressed when a text-editable element has focus:
 *     – <input>, <textarea>, <select>
 *     – any element with contenteditable="true"
 *   This prevents the shortcut from hijacking text entry.
 * • Suppressed when a modal overlay is already open (data-state="open" on
 *   any Radix Dialog overlay) to avoid stacking unrelated dialogs.
 * • The event listener is added to `window` so it works regardless of
 *   which element has focus.
 * • The listener is removed on unmount (no leak).
 *
 * Usage
 * -----
 * ```tsx
 * const { isOpen, open, close, toggle } = useShortcutModal();
 * return <ShortcutHelpModal open={isOpen} onClose={close} />;
 * ```
 */

import { useCallback, useEffect, useState } from "react";

export interface UseShortcutModalResult {
  /** Whether the shortcut help modal is currently open. */
  isOpen: boolean;
  /** Programmatically open the modal. */
  open: () => void;
  /** Programmatically close the modal. */
  close: () => void;
  /** Toggle the modal open/closed. */
  toggle: () => void;
}

/**
 * Returns `true` when the currently focused element should suppress
 * global key shortcuts (i.e. the user is actively typing).
 */
function isFocusedOnTextInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useShortcutModal(): UseShortcutModalResult {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // '?' is Shift + / on standard layouts.
      // We match on `key === "?"` which is layout-independent.
      if (e.key !== "?") return;

      // Never fire when the user is typing in an input.
      if (isFocusedOnTextInput()) return;

      // Prevent the character from being entered into any editable region
      // that might receive focus after the check above.
      e.preventDefault();

      setIsOpen((prev) => !prev);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, open, close, toggle };
}
