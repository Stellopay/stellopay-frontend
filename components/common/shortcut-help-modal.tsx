"use client";

/**
 * ShortcutHelpModal
 * -----------------
 * A Radix UI Dialog that lists every registered keyboard shortcut, grouped
 * by context (Global, Navigation, Dashboard, Transactions).
 *
 * Accessibility (WCAG 2.1 AA)
 * ---------------------------
 * • Dialog role + aria-labelledby/aria-describedby wired by Radix.
 * • Focus is trapped inside the dialog while open (Radix default).
 * • Escape closes the dialog (Radix default).
 * • Each shortcut key is wrapped in <kbd> with role="img" and an
 *   aria-label so screen readers announce e.g. "g then d" instead of
 *   reading two unrelated characters.
 * • The close button has an explicit aria-label.
 * • Group headings are <h3> so the heading hierarchy is preserved.
 * • The scroll container has tabIndex={0} so keyboard users can scroll it.
 *
 * Responsive behaviour
 * --------------------
 * • Full-width on xs; max-w-lg (32 rem) from sm upwards.
 * • Two-column grid from md upwards (each group in its own cell).
 * • Max-height + overflow-y-auto prevents the modal from overflowing the
 *   viewport on small screens or when many groups are registered.
 */

import * as React from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/utils/commonUtils";
import { SHORTCUT_GROUPS, type ShortcutGroup } from "@/lib/shortcuts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShortcutHelpModalProps {
  /** Controls modal visibility. */
  open: boolean;
  /** Called when the user requests the modal to close. */
  onClose: () => void;
  /**
   * Override the shortcut groups displayed. Defaults to `SHORTCUT_GROUPS`
   * from `lib/shortcuts.ts`.  Pass a custom array in tests or storybook to
   * keep fixtures stable.
   */
  groups?: ShortcutGroup[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renders a single shortcut key badge.
 * Uses <kbd> semantics so screen readers / browser devtools recognise it
 * as a keyboard key, and adds role="img" + aria-label for multi-key combos.
 */
function ShortcutKey({
  keyLabel,
  ariaLabel,
}: {
  keyLabel: string;
  ariaLabel?: string;
}) {
  return (
    <kbd
      aria-label={ariaLabel}
      className={cn(
        // Layout
        "inline-flex items-center justify-center",
        "min-w-[1.75rem] h-7 px-2",
        // Typography
        "font-mono text-xs font-semibold",
        // Colours — light/dark
        "bg-zinc-100 text-zinc-700",
        "dark:bg-zinc-800 dark:text-zinc-200",
        // Border gives a "key cap" appearance
        "rounded border border-b-2 border-zinc-300 dark:border-zinc-600",
        // No text-wrap for long keys (e.g. "ArrowRight")
        "whitespace-nowrap",
      )}
    >
      {keyLabel}
    </kbd>
  );
}

/**
 * Renders one group (e.g. "Navigation") with its shortcut rows.
 */
function ShortcutGroupSection({ group }: { group: ShortcutGroup }) {
  return (
    <section aria-labelledby={`shortcut-group-${group.id}`} className="space-y-3">
      <h3
        id={`shortcut-group-${group.id}`}
        className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
      >
        {group.label}
      </h3>

      <ul className="space-y-2" role="list">
        {group.shortcuts.map((shortcut, idx) => {
          // Build an accessible label for the key sequence:
          // ["g", "d"] → "g then d"
          const keysAriaLabel = shortcut.keys.join(" then ");

          return (
            <li
              key={idx}
              className="flex items-center justify-between gap-4 py-1"
            >
              {/* Description */}
              <span className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">
                {shortcut.description}
              </span>

              {/* Key sequence */}
              <span
                className="flex items-center gap-1 shrink-0"
                role="img"
                aria-label={keysAriaLabel}
              >
                {shortcut.keys.map((k, ki) => (
                  <React.Fragment key={ki}>
                    {ki > 0 && (
                      <span
                        aria-hidden="true"
                        className="text-xs text-zinc-400 dark:text-zinc-500 select-none"
                      >
                        then
                      </span>
                    )}
                    <ShortcutKey keyLabel={k} />
                  </React.Fragment>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShortcutHelpModal({
  open,
  onClose,
  groups = SHORTCUT_GROUPS,
}: ShortcutHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          // Width: full on xs, capped at lg on larger screens
          "w-full sm:max-w-lg lg:max-w-2xl",
          // Constrain height so the modal never overflows the viewport
          "max-h-[90dvh]",
          // Internal layout
          "flex flex-col gap-0 p-0 overflow-hidden",
        )}
        aria-modal="true"
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Keyboard
              size={18}
              aria-hidden="true"
              className="text-zinc-500 dark:text-zinc-400 shrink-0"
            />
            <DialogTitle className="text-base font-semibold">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Press{" "}
            <ShortcutKey keyLabel="?" />
            {" "}at any time to open this reference. Shortcuts are suppressed
            while a text input has focus.
          </DialogDescription>
        </DialogHeader>

        {/* ── Shortcut list ── */}
        {/*
         * tabIndex={0} makes the scroll container keyboard-focusable so
         * users can scroll through the list without a mouse (WCAG 2.1.1).
         */}
        <div
          role="region"
          aria-label="Keyboard shortcut list"
          tabIndex={0}
          className={cn(
            "overflow-y-auto flex-1",
            "px-6 py-5",
            // Scrollbar styling (cosmetic, non-functional for a11y)
            "scrollbar-hide",
            // Two-column grid from md+
            "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6",
            // Give focus an indicator when the scroll region itself is focused
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          {groups.length === 0 ? (
            <p
              role="status"
              className="col-span-full text-sm text-zinc-400 dark:text-zinc-500 text-center py-8"
            >
              No shortcuts registered.
            </p>
          ) : (
            groups.map((group) => (
              <ShortcutGroupSection key={group.id} group={group} />
            ))
          )}
        </div>

        {/* ── Footer hint ── */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Press{" "}
            <kbd
              aria-label="Escape"
              className="inline-flex items-center justify-center h-5 px-1.5 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 border border-b-2 border-zinc-300 dark:border-zinc-600 rounded text-zinc-500 dark:text-zinc-400"
            >
              Esc
            </kbd>{" "}
            or click outside to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
