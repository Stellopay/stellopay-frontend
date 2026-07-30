"use client";

import React from "react";
import { cn } from "@/utils/commonUtils";

/**
 * Visual tone of a state panel.
 *
 * `neutral` is the absence of data (nothing went wrong).
 * `danger` is a failure the user may be able to recover from.
 *
 * Tone controls colour only. Layout, spacing and typography are identical
 * across tones so switching between an empty result and a failed request in
 * the same view does not shift the page.
 */
export type StatePanelTone = "neutral" | "danger";

const TONE_STYLES: Record<StatePanelTone, { surface: string; icon: string; ring: string }> = {
  neutral: {
    surface:
      "border-zinc-200 bg-zinc-50 dark:border-[#2D2D2D] dark:bg-[#111111]",
    icon: "text-zinc-500 dark:text-zinc-400",
    ring: "focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-[#111111]",
  },
  danger: {
    surface:
      "border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10",
    icon: "text-red-600 dark:text-red-500",
    ring: "focus-visible:ring-offset-red-50 dark:focus-visible:ring-offset-[#170d0d]",
  },
};

export interface StatePanelProps {
  /** Colour treatment. Defaults to `neutral`. */
  tone?: StatePanelTone;
  /**
   * ARIA role. `status` for absence of data, `alert` for failures.
   * Defaults to `status`.
   */
  role?: "status" | "alert";
  /**
   * Live-region urgency. Pair `polite` with `status` and `assertive` with
   * `alert`. Defaults to `polite`.
   */
  live?: "polite" | "assertive";
  /** Icon element. Sized by the panel, so pass an unsized icon. */
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Call-to-action and any tone-specific extras, rendered below the copy. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The single layout definition shared by `EmptyState` and `ErrorState`.
 *
 * Both components solve closely related problems (no data vs failed to load)
 * and previously carried independent copies of the same markup, which drifted.
 * This owns the shared pattern - icon, heading, body copy, optional action -
 * so only the semantic differences (icon, copy, tone, live-region urgency)
 * live in the two wrappers.
 *
 * Accessibility:
 * - The panel is a live region so the state is announced when it replaces
 *   content in place. `EmptyState` is polite (nothing is wrong, do not
 *   interrupt); `ErrorState` is assertive (the user's action failed).
 * - The icon is decorative and `aria-hidden`; the heading and description
 *   carry the meaning, so nothing is conveyed by colour or glyph alone
 *   (SC 1.4.1).
 * - The heading is an `h3`, keeping panels nested inside a section's `h2`
 *   without skipping a level (SC 1.3.1).
 */
export function StatePanel({
  tone = "neutral",
  role = "status",
  live = "polite",
  icon,
  title,
  description,
  children,
  className,
}: StatePanelProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      role={role}
      aria-live={live}
      data-tone={tone}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border text-center",
        "px-4 py-8 sm:px-8 sm:py-10",
        styles.surface,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn("mb-4 [&>svg]:h-10 [&>svg]:w-10", styles.icon)}
      >
        {icon}
      </div>
      <h3 className="text-balance text-lg font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-pretty text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {children && (
        <div className="mt-6 flex flex-col items-center gap-3">{children}</div>
      )}
    </div>
  );
}

export type StatePanelActionProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: StatePanelTone;
  };

/**
 * The shared call-to-action button for both state panels.
 *
 * Identical geometry regardless of tone, so the CTA does not move when a view
 * swaps an empty result for a failed request. `type="button"` is explicit so
 * the button never submits a surrounding form.
 *
 * Carries a visible `focus-visible` ring (SC 2.4.7) with a tone-matched offset
 * colour, and disabled styling for the in-flight retry case.
 */
export function StatePanelAction({
  tone = "neutral",
  className,
  children,
  ...props
}: StatePanelActionProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2",
        "text-sm font-medium text-white transition-colors",
        "bg-zinc-900 hover:bg-zinc-800 dark:bg-[#2D2D2D] dark:hover:bg-[#3A3A3A]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900",
        "focus-visible:ring-offset-2 dark:focus-visible:ring-[#D7E0EF]",
        TONE_STYLES[tone].ring,
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
