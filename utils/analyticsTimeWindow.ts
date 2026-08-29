/**
 * @module analyticsTimeWindow
 *
 * Deterministic, UTC-based time-window parser and validator for analytics
 * filters.  This module is the **single source of truth** for:
 *
 * 1. Normalising preset windows (7d / 30d / 90d) to stable UTC midnights so
 *    daylight-saving transitions never shift the requested window.
 * 2. Validating custom date ranges **before** a network request is fired,
 *    rejecting reversed / oversized / identical-boundary ranges.
 * 3. Providing an inclusive-range predicate that normalises both the data
 *    points and the boundaries to UTC calendar days so the comparison is
 *    locale- and DST-independent.
 *
 * ## Design decisions
 *
 * | Decision | Rationale |
 * |---|---|
 * | All internal arithmetic uses UTC `Date` objects | Avoids DST-related hour-skipping / hour-doubling that local-time `new Date(y, m, d)` suffers. |
 * | Boundaries are normalised to UTC midnight (`startOfDayUTC`) | "7 days ago" means "the UTC day 7 days ago at 00:00", not "24 × 7 hours ago". |
 * | Range semantics are **inclusive on both ends** | `[from, to]` includes the `to` day itself. This matches the transaction date-range predicate convention. |
 * | Reversed ranges are rejected | `from > to` is a user error; surfacing it early prevents a wasted API round-trip. |
 * | Maximum range is configurable (default 365 days) | Prevents accidental multi-year fetches that could degrade UX. |
 */

// ── Constants ───────────────────────────────────────────────────────────────

/** Milliseconds in one UTC day. */
const MS_PER_DAY = 86_400_000;

/**
 * Maximum allowed range length in days (inclusive of both endpoints).
 *
 * The default of **365 days** (1 year) is deliberately generous — analytics
 * dashboards rarely need more, and it prevents accidental multi-year fetches.
 *
 * Exported so callers can override it if needed.
 */
export const MAX_RANGE_DAYS = 365;

// ── UTC normalisation helpers ────────────────────────────────────────────────

/**
 * Returns a new `Date` set to UTC midnight (00:00:00.000Z) of the same
 * calendar day that `d` represents in UTC.
 *
 * This is the canonical normaliser — all range comparisons go through it so
 * that DST and locale differences are irrelevant.
 *
 * @example
 * ```ts
 * startOfDayUTC(new Date("2026-03-29T23:59:59.999Z"))
 * // → Date representing 2026-03-29T00:00:00.000Z
 * ```
 */
export function startOfDayUTC(d: Date): Date {
  const utcMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return new Date(utcMs);
}

/**
 * Returns the number of whole UTC calendar days between two UTC dates.
 *
 * Both dates are first normalised to UTC midnight, so time-of-day is
 * irrelevant.
 *
 * @returns A **non-negative** integer representing `to − from` in days.
 */
export function daysBetweenUTC(from: Date, to: Date): number {
  const fromMs = startOfDayUTC(from).getTime();
  const toMs = startOfDayUTC(to).getTime();
  return Math.round((toMs - fromMs) / MS_PER_DAY);
}

// ── Preset window computation ────────────────────────────────────────────────

/**
 * Preset key for analytics date-range pickers.
 *
 * - `"7d"` / `"30d"` / `"90d"` — relative windows computed from "today" (UTC).
 * - `"custom"` — user-specified from/to dates.
 */
export type AnalyticsDatePreset = "7d" | "30d" | "90d" | "custom";

/**
 * Result of parsing a date-range value into deterministic UTC boundaries.
 *
 * Both `from` and `to` are UTC-midnight `Date` objects.
 * The range is **inclusive on both ends** — i.e. both the `from` day and the
 * `to` day are included.
 */
export interface ParsedTimeWindow {
  /** Inclusive start of the range (UTC midnight). */
  from: Date;
  /** Inclusive end of the range (UTC midnight). */
  to: Date;
  /** The resolved preset key. */
  preset: AnalyticsDatePreset;
}

/**
 * Describes why a time-window validation failed.
 *
 * The `type` discriminant lets callers branch on the failure reason without
 * string-matching.
 */
export type TimeWindowError =
  | { type: "reversed_range"; message: string }
  | { type: "zero_length"; message: string }
  | { type: "exceeds_max"; message: string; maxDays: number }
  | { type: "invalid_date"; message: string };

// ── Preset computation ───────────────────────────────────────────────────────

/**
 * Computes the UTC start date for a relative preset relative to `now`.
 *
 * The result is always a UTC-midnight date.  For example, if `now` is
 * `2026-08-29T14:30:00Z` and `preset` is `"7d"`, the returned date is
 * `2026-08-22T00:00:00Z`.
 *
 * **DST safety:** Because we work exclusively in UTC, a DST transition that
 * falls inside the window never changes the *calendar-day* span.  "7 days
 * ago" always means "the UTC calendar day 7 days before today", regardless of
 * what timezone the user's browser is in.
 *
 * @param preset - One of `"7d"`, `"30d"`, or `"90d"`.
 * @param now    - Reference clock.  Defaults to `new Date()`.
 * @returns A UTC-midnight `Date` representing the start of the window.
 */
export function getPresetStartDate(
  preset: Extract<AnalyticsDatePreset, "7d" | "30d" | "90d">,
  now: Date = new Date(),
): Date {
  const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const numDays = days[preset];
  const todayUtc = startOfDayUTC(now);
  return new Date(todayUtc.getTime() - numDays * MS_PER_DAY);
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates that the given `from` and `to` dates represent a legal
 * analytics time window.
 *
 * Checks performed (in order):
 * 1. Both dates must be valid `Date` objects.
 * 2. `from` must not be after `to` (reversed range).
 * 3. `from` and `to` must not be the same day (zero-length range).
 * 4. The span must not exceed {@link MAX_RANGE_DAYS} calendar days.
 *
 * On success the function returns `null`.  On failure it returns a
 * discriminated-union {@link TimeWindowError} that the caller can surface to
 * the user or log for telemetry.
 *
 * @param from     - Start of the range (inclusive).
 * @param to       - End of the range (inclusive).
 * @param maxDays  - Override for the maximum allowed range length.
 * @returns `null` on success, or a `TimeWindowError`.
 */
export function validateTimeWindow(
  from: Date | undefined,
  to: Date | undefined,
  maxDays: number = MAX_RANGE_DAYS,
): TimeWindowError | null {
  // ── Step 1: validity ──────────────────────────────────────────────────
  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return {
      type: "invalid_date",
      message:
        "Invalid date range: one or both dates could not be parsed. Please select a valid range.",
    };
  }

  const fromUtc = startOfDayUTC(from);
  const toUtc = startOfDayUTC(to);

  // ── Step 2: reversed ──────────────────────────────────────────────────
  if (fromUtc.getTime() > toUtc.getTime()) {
    return {
      type: "reversed_range",
      message:
        "Invalid date range: the start date must be on or before the end date.",
    };
  }

  // ── Step 3: zero-length ───────────────────────────────────────────────
  if (fromUtc.getTime() === toUtc.getTime()) {
    return {
      type: "zero_length",
      message:
        "Invalid date range: start and end dates fall on the same day. Please select different dates.",
    };
  }

  // ── Step 4: maximum length ────────────────────────────────────────────
  const spanDays = daysBetweenUTC(fromUtc, toUtc);
  if (spanDays > maxDays) {
    return {
      type: "exceeds_max",
      message: `Invalid date range: the selected range spans ${spanDays} days, which exceeds the maximum of ${maxDays} days.`,
      maxDays,
    };
  }

  return null;
}

// ── Range predicate ──────────────────────────────────────────────────────────

/**
 * Creates an **inclusive** range predicate that checks whether a `Date` falls
 * within the normalised UTC window `[from, to]`.
 *
 * Both the candidate date and the boundaries are normalised to UTC midnight
 * before comparison, so time-of-day and DST transitions are irrelevant.
 *
 * ### Equal start/end (documentation)
 *
 * When `from` and `to` resolve to the same UTC calendar day, the predicate
 * matches **only** data points from that specific day.  This is the correct
 * behaviour for "show me everything for exactly one day".  If the caller
 * wants to *exclude* single-day ranges, they should validate with
 * {@link validateTimeWindow} first — which rejects zero-length ranges.
 *
 * @example
 * ```ts
 * const withinRange = createUtcRangePredicate(from, to);
 * withinRange(new Date("2026-08-20T12:00:00Z")); // true if in [from, to]
 * ```
 *
 * @param from - Inclusive start (UTC midnight preferred, but any Date works).
 * @param to   - Inclusive end (UTC midnight preferred, but any Date works).
 * @returns A predicate `(date: Date) => boolean`.
 */
export function createUtcRangePredicate(
  from: Date,
  to: Date,
): (date: Date) => boolean {
  const fromMs = startOfDayUTC(from).getTime();
  const toMs = startOfDayUTC(to).getTime();

  return (date: Date): boolean => {
    const dateMs = startOfDayUTC(date).getTime();
    return dateMs >= fromMs && dateMs <= toMs;
  };
}

// ── Full parse + validate pipeline ───────────────────────────────────────────

/**
 * Result of {@link parseAnalyticsTimeWindow} on success.
 */
export interface ParseResultOk {
  ok: true;
  window: ParsedTimeWindow;
}

/**
 * Result of {@link parseAnalyticsTimeWindow} on failure.
 */
export interface ParseResultErr {
  ok: false;
  error: TimeWindowError;
}

/** Discriminated union returned by {@link parseAnalyticsTimeWindow}. */
export type ParseResult = ParseResultOk | ParseResultErr;

/**
 * Parses a preset or custom date range into a fully-validated
 * {@link ParsedTimeWindow}.
 *
 * This is the **primary entry point** for callers.  It:
 *
 * 1. Resolves the effective `from` / `to` dates (preset arithmetic for
 *    relative presets, passthrough for custom).
 * 2. Runs {@link validateTimeWindow} on the resolved dates.
 * 3. Returns either the validated window or a descriptive error.
 *
 * @example
 * ```ts
 * const result = parseAnalyticsTimeWindow({ preset: "7d" });
 * if (!result.ok) {
 *   console.error(result.error.message);
 * } else {
 *   const { from, to } = result.window;
 *   fetchData(from, to);
 * }
 * ```
 *
 * @param options.preset  - The selected preset key.
 * @param options.from    - Custom start date (required when preset is `"custom"`).
 * @param options.to      - Custom end date (required when preset is `"custom"`).
 * @param options.now     - Reference clock for preset computation.
 * @param options.maxDays - Override for max range validation.
 * @returns A {@link ParseResult}.
 */
export function parseAnalyticsTimeWindow(options: {
  preset: AnalyticsDatePreset;
  from?: Date;
  to?: Date;
  now?: Date;
  maxDays?: number;
}): ParseResult {
  const { preset, from, to, now = new Date(), maxDays = MAX_RANGE_DAYS } = options;

  let effectiveFrom: Date;
  let effectiveTo: Date;

  if (preset === "custom") {
    if (!from || !to) {
      return {
        ok: false,
        error: {
          type: "invalid_date",
          message:
            "Custom date range requires both a start and end date.",
        },
      };
    }
    effectiveFrom = from;
    effectiveTo = to;
  } else {
    effectiveFrom = getPresetStartDate(preset, now);
    effectiveTo = startOfDayUTC(now);
  }

  const error = validateTimeWindow(effectiveFrom, effectiveTo, maxDays);
  if (error) {
    return { ok: false, error };
  }

  return {
    ok: true,
    window: {
      from: startOfDayUTC(effectiveFrom),
      to: startOfDayUTC(effectiveTo),
      preset,
    },
  };
}
