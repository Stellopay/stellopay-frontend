"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getShortcutGroups,
  GROUP_LABELS,
  type ShortcutEntry,
} from "@/lib/shortcut-registry";

/**
 * ShortcutHelpModal — a global '?' triggered modal listing every keyboard
 * shortcut in the app, grouped by context area.
 *
 * Behaviour:
 * - Mounts once in the root layout; listens for the '?' key (Shift + /).
 * - Suppressed when a text input, textarea, or contenteditable has focus
 *   so users can type a literal '?' character.
 * - Escape or clicking outside closes the modal.
 * - A permanent "?" button in the bottom-right corner also opens the modal.
 *
 * WCAG 2.1 AA:
 * - The dialog is role="dialog" with aria-modal="true" (from Radix).
 * - Focus is trapped inside the dialog while open.
 * - The trigger (Shift + /) is a standard key that does not conflict with
 *   assistive technology.
 * - Shortcut groups are announced via aria-labelledby.
 * - Each shortcut row has a visible label and keybinding.
 */
export function ShortcutHelpModal() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // The '?' key is produced by Shift + / on US layout.
      if (event.key !== "/" || !event.shiftKey) return;

      // Suppress when the user is typing in a text control.
      const target = event.target as HTMLElement | null;
      // When the key event bubbles to `document`, the target may be the
      // Document node itself (no tagName) — that is not a text control, so
      // we should NOT suppress. Only actual form/text controls suppress.
      if (target && "tagName" in target) {
        const tag = target.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          target.isContentEditable
        ) {
          return;
        }

        // Also suppress if the focused element has role="textbox" (ARIA).
        if (target.getAttribute("role") === "textbox") return;
      }

      event.preventDefault();
      setOpen((prev) => !prev);
    },
    [],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const groups = getShortcutGroups();

  return (
    <>
      {/* Visual hint for the '?' shortcut — fixed to bottom-right corner */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold shadow-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Open keyboard shortcuts help"
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Press <kbd className="rounded border border-border px-1.5 py-0.5 text-xs font-mono">?</kbd>{" "}
              at any time to toggle this modal. Shortcuts are grouped by
              context area below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {(Object.keys(groups) as Array<keyof typeof groups>).map(
              (groupKey) => {
                const shortcuts = groups[groupKey];
                if (shortcuts.length === 0) return null;

                return (
                  <section key={groupKey} aria-labelledby={`shortcut-group-${groupKey}`}>
                    <h3
                      id={`shortcut-group-${groupKey}`}
                      className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2"
                    >
                      {GROUP_LABELS[groupKey]}
                    </h3>
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {shortcuts.map((shortcut, idx) => (
                        <ShortcutRow key={`${groupKey}-${idx}`} shortcut={shortcut} />
                      ))}
                    </ul>
                  </section>
                );
              },
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Renders a single shortcut as a labelled row.
 */
function ShortcutRow({ shortcut }: { shortcut: ShortcutEntry }) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium">{shortcut.label}</span>
        {shortcut.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {shortcut.description}
          </p>
        )}
      </div>
      <kbd className="shrink-0 rounded border border-border bg-muted px-2 py-1 text-xs font-mono font-medium whitespace-nowrap">
        {shortcut.keys}
      </kbd>
    </li>
  );
}