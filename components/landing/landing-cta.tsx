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
 * Input validation
 * ----------------
 * `heading` and `subtext` are validated at render entry, before any markup or
 * child component is produced. Malformed, empty and oversized values are
 * rejected with a typed `LandingCtaInputError` carrying a stable `field` and
 * `code`, so callers can tell exactly why the input was rejected. Nothing is
 * rendered — and no child (and therefore no child state) is mounted — when
 * validation fails.
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

/** Maximum characters accepted for the card heading. */
export const MAX_HEADING_LENGTH = 120;

/** Maximum characters accepted for the card subtext. */
export const MAX_SUBTEXT_LENGTH = 500;

/** The `LandingCta` props that carry user-visible copy. */
export type LandingCtaField = "heading" | "subtext";

/**
 * Why an input was rejected.
 *
 * - `MALFORMED` — the value is not a string at runtime (e.g. `null`,
 *   `undefined`, a number, or an object reaching the prop through an
 *   untyped caller).
 * - `EMPTY` — the value contains no non-whitespace characters.
 * - `OVERSIZED` — the value exceeds the field's character limit.
 */
export type LandingCtaInputErrorCode = "MALFORMED" | "EMPTY" | "OVERSIZED";

/**
 * Typed rejection for invalid `LandingCta` copy.
 *
 * Carries structured `field` and `code` properties so a caller (or a test)
 * can distinguish the failure reason without parsing the message.
 */
export class LandingCtaInputError extends Error {
  /** Which prop was rejected. */
  readonly field: LandingCtaField;
  /** Why the prop was rejected. */
  readonly code: LandingCtaInputErrorCode;

  constructor(
    field: LandingCtaField,
    code: LandingCtaInputErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LandingCtaInputError";
    this.field = field;
    this.code = code;
  }
}

function describeRuntimeType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function assertLandingCtaText(
  field: LandingCtaField,
  value: unknown,
  maxLength: number,
): void {
  if (typeof value !== "string") {
    throw new LandingCtaInputError(
      field,
      "MALFORMED",
      `landing-cta: \`${field}\` must be a string, received ${describeRuntimeType(value)}`,
    );
  }

  // Whitespace-only copy is treated as empty, so an oversized run of spaces
  // reports EMPTY rather than OVERSIZED — the caller sees the useful reason.
  if (value.trim().length === 0) {
    throw new LandingCtaInputError(
      field,
      "EMPTY",
      `landing-cta: \`${field}\` must contain at least one non-whitespace character`,
    );
  }

  if (value.length > maxLength) {
    throw new LandingCtaInputError(
      field,
      "OVERSIZED",
      `landing-cta: \`${field}\` exceeds ${maxLength} characters (received ${value.length})`,
    );
  }
}

/**
 * Validates the copy props of `LandingCta`.
 *
 * Throws `LandingCtaInputError` on the first invalid field (checked in
 * `heading`, `subtext` order) and returns normally for valid input.
 *
 * @throws {LandingCtaInputError} when a field is malformed, empty, or oversized.
 */
export function validateLandingCtaInput(
  heading: unknown,
  subtext: unknown,
): void {
  assertLandingCtaText("heading", heading, MAX_HEADING_LENGTH);
  assertLandingCtaText("subtext", subtext, MAX_SUBTEXT_LENGTH);
}

export function LandingCta({
  heading,
  subtext,
  children,
  ariaLabelledby,
  className,
}: LandingCtaProps) {
  // Reject invalid copy before anything is rendered: no markup is produced,
  // no child component mounts, and therefore no state is written.
  validateLandingCtaInput(heading, subtext);

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
