"use client";

import { type ReactNode } from "react";
import { cn } from "@/utils/commonUtils";

/**
 * Shared landing-page CTA card component.
 *
 * Renders a gradient-adjacent card with heading, subtext, and children
 * (typically buttons or a form) in a consistent layout. Used by both
 * `GetStartedCTA` and `HelpCTASection` to avoid duplicated markup.
 *
 * Accessibility
 * -------------
 * - Accepts an `aria-labelledby` value for section labelling.
 * - Card uses semantic tokens (`bg-card`, `border-border`) so it follows
 *   the global design system across light and dark themes.
 */

export interface LandingCtaProps {
  /** Heading text rendered inside the card. */
  heading: string;
  /** Secondary text below the heading. */
  subtext: string;
  /** Buttons, form, or other interactive content. */
  children: ReactNode;
  /** Optional aria-labelledby value. */
  ariaLabelledby?: string;
  /** Optional additional class names for the outer section. */
  className?: string;
}

export function LandingCta({
  heading,
  subtext,
  children,
  ariaLabelledby,
  className,
}: LandingCtaProps) {
  return (
    <section
      className={cn(
        "bg-white dark:bg-[#040404] py-24 px-4 sm:px-6 lg:px-8",
        className,
      )}
      aria-labelledby={ariaLabelledby}
    >
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-white dark:bg-card border border-[#E4E4E7] dark:border-border p-8 sm:p-16 text-center shadow-lg transition-colors duration-300">
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="font-bold tracking-tight text-[#09090B] dark:text-[#FAFAFA] font-inter">
            {heading}
          </h2>
          <p className="mb-10 max-w-xl text-[20px] text-[#52525B] dark:text-[#A3A3A3] font-general">
            {subtext}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
