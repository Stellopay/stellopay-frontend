/**
 * Shared input token contract for common input components.
 *
 * All common input components (TextInput, TextareaInput) must use these
 * design tokens to ensure visual consistency with the canonical shadcn Input
 * (`components/ui/input.tsx`).
 *
 * ## Token Coverage
 *
 * - default border, hover, focus, focus ring
 * - background, foreground, placeholder
 * - disabled, error
 * - radius, spacing, transition timing
 * - dark mode
 *
 * ## Usage
 *
 * ```tsx
 * <div className={cn(
 *   INPUT_WRAPPER_CLASSES,
 *   "h-12 items-center",   // component-specific
 *   error ? INPUT_ERROR_CLASSES : INPUT_DEFAULT_CLASSES,
 *   disabled && INPUT_DISABLED_CLASSES,
 * )}>
 *   <input className={cn(INPUT_INNER_CLASSES, icon && "pl-0")} />
 * </div>
 * ```
 */

// ── Wrapper (the border/ring container) ──────────────────────────────────────

/** Base classes for the input wrapper `<div>` — border, radius, shadow, transition, dark mode. */
export const INPUT_WRAPPER_CLASSES =
  "flex border rounded-md overflow-hidden transition-[color,box-shadow] shadow-xs dark:bg-input/30";

/** Default (idle) state: input border + focus ring on `:focus-within`. */
export const INPUT_DEFAULT_CLASSES =
  "border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]";

/** Error / destructive state: red border and ring (includes focus). */
export const INPUT_ERROR_CLASSES =
  "border-destructive ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/50";

/** Disabled state: reduced opacity, no pointer events, not-allowed cursor. */
export const INPUT_DISABLED_CLASSES =
  "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

// ── Inner element (the actual `<input>` / `<textarea>`) ─────────────────────

/**
 * Base classes for the inner `<input>` or `<textarea>`:
 * transparent background, no outline, foreground text, muted placeholder.
 */
export const INPUT_INNER_CLASSES =
  "px-3 w-full bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground";
