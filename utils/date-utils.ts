import { format, parse, isValid, startOfDay } from "date-fns";
import { safeStorage, STORAGE_KEYS } from "@/utils/safeStorage";

/**
 * Single source of truth for date parsing, formatting, and range checks.
 *
 * Consolidates the legacy `utils/dateUtils.ts` (which used the
 * locale-dependent `Date.prototype.toLocaleDateString`) and the original
 * `utils/date-utils.ts` (date-fns based) into one module so formatting is
 * deterministic regardless of the host machine's locale.
 *
 * ---
 * ## Timezone convention
 *
 * **All functions in this module display dates in the viewer's local timezone.**
 *
 * - Input: ISO 8601 strings (e.g. `"2023-04-15T23:30:00.000Z"`) are parsed
 *   into `Date` objects and **normalized to the local calendar day** via
 *   `date-fns/startOfDay` before formatting.
 * - This ensures a UTC timestamp near midnight (e.g. 23:30 UTC on Apr 15)
 *   consistently displays as the correct local calendar date (Apr 16 in
 *   UTC+2, Apr 15 in UTC-5) rather than silently showing the UTC date.
 * - The `formatDateTimeWithTimezone` helper is the exception — it accepts an
 *   explicit IANA timezone and formats accordingly.
 *
 * **Never** call `date-fns/format` or `Date.prototype.toLocaleDateString`
 * directly from components — always route through a helper here so the
 * convention stays uniform.
 */

/**
 * Attempts to parse a transaction date string.
 *
 * Expected input format: `MMM dd, yyyy` (e.g. `Apr 12, 2023`).
 *
 * If parsing fails or the input does not represent a valid calendar date,
 * this function returns `null`.
 *
 * @param dateString - Transaction date string in `MMM dd, yyyy` format.
 * @returns Parsed `Date` at the best-effort local time, or `null`.
 */
export function parseTransactionDate(dateString: string): Date | null {
  const raw = dateString?.trim();
  if (!raw) return null;

  try {
    // Parse the date string "Apr 12, 2023" format.
    const parsed = parse(raw, "MMM dd, yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Formats a date (or date-like string) into a deterministic `MMM dd, yyyy` string.
 *
 * This function uses `date-fns/format`, which avoids locale-dependent output
 * from `Date.prototype.toLocaleDateString`.
 *
 * @param dateLike - A `Date` instance or a parsable date string.
 * @returns Formatted date string in `MMM dd, yyyy` format, or an empty string
 * if `dateLike` does not represent a valid date.
 */
export function formatDate(dateLike: Date | string): string {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (!isValid(date)) return "";
  // Normalize to start of local calendar day so a UTC timestamp near
  // midnight (e.g. 23:30Z on Apr 15 in UTC+2 → local Apr 16) always
  // displays the correct local date.
  return format(startOfDay(date), "MMM dd, yyyy");
}

/**
 * Formats a date to `YYYY-MM-DD` (commonly used for form inputs).
 *
 * @param date - Date instance to format.
 * @returns Date string in `YYYY-MM-DD` format.
 */
export function formatDateForInput(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

/**
 * Formats a date for display as `DD-MM-YYYY`.
 *
 * @param date - Date instance to format.
 * @returns Date string in `DD-MM-YYYY` format.
 */
export function formatDateForDisplay(date: Date): string {
  return format(startOfDay(date), "dd-MM-yyyy");
}

/**
 * Checks if a parsed transaction date is within a range.
 *
 * Range behavior:
 * - If `transactionDate` cannot be parsed, this returns `true` (fail-open) to avoid
 *   hiding transactions when date parsing is unexpected.
 * - If neither `startDate` nor `endDate` is provided, this returns `true`.
 * - Boundaries are inclusive.
 *
 * @param transactionDate - Transaction date string in `MMM dd, yyyy` format.
 * @param startDate - Optional range start.
 * @param endDate - Optional range end.
 * @returns `true` if within range or if range checks are not applicable.
 */
export function isDateInRange(
  transactionDate: string,
  startDate: Date | undefined,
  endDate: Date | undefined,
): boolean {
  const parsedDate = parseTransactionDate(transactionDate);

  if (!parsedDate) return true;

  // Normalize to start-of-day so date-only inputs (and timezone-shifted
  // `startDate`/`endDate` pickers) compare on calendar days, not instants.
  const parsedDay = startOfDay(parsedDate).getTime();

  if (startDate && parsedDay < startOfDay(startDate).getTime()) return false;
  if (endDate && parsedDay > startOfDay(endDate).getTime()) return false;

  return true;
}

/**
 * Gets the current date in `YYYY-MM-DD` format.
 *
 * @returns Current date string in `YYYY-MM-DD`.
 */
export function getCurrentDate(): string {
  return formatDateForInput(new Date());
}

/** Default age, in days, past which relative time gives way to an absolute date. */
export const RELATIVE_TIME_THRESHOLD_DAYS = 7;

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Coerces a `Date` or date-like string into a valid `Date`, or `null`.
 */
function toValidDate(dateLike: Date | string | null | undefined): Date | null {
  if (dateLike === null || dateLike === undefined || dateLike === "") return null;
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  return isValid(date) ? date : null;
}

/**
 * Formats a timestamp as a short, scannable relative time string.
 *
 * Buckets (past):
 * - `< 60s`            → `"just now"`
 * - `< 60m`            → `"5m ago"`
 * - `< 24h`            → `"2h ago"`
 * - exactly 1 day      → `"yesterday"`
 * - `2..6 days`        → `"3d ago"`
 * - `>= thresholdDays` → absolute `MMM dd, yyyy` (see {@link formatDate})
 *
 * Future timestamps mirror the same buckets (`"in 5m"`, `"tomorrow"`, …) so a
 * clock skew between client and server never renders as a negative age.
 *
 * @param dateLike - A `Date` instance or a parsable date string.
 * @param options.now - Reference point for "now". Defaults to the current time.
 * Injecting it keeps tests deterministic.
 * @param options.thresholdDays - Age in days past which an absolute date is
 * returned instead. Defaults to {@link RELATIVE_TIME_THRESHOLD_DAYS}.
 * @returns The relative time string, or an empty string when `dateLike` is not
 * a valid date.
 */
export function formatRelativeTime(
  dateLike: Date | string | null | undefined,
  options: { now?: Date; thresholdDays?: number } = {},
): string {
  const date = toValidDate(dateLike);
  if (!date) return "";

  const { now = new Date(), thresholdDays = RELATIVE_TIME_THRESHOLD_DAYS } =
    options;
  if (!isValid(now)) return "";

  const deltaMs = now.getTime() - date.getTime();
  const isFuture = deltaMs < 0;
  const absMs = Math.abs(deltaMs);

  if (absMs >= thresholdDays * MS_PER_DAY) return formatDate(date);

  if (absMs < MS_PER_MINUTE) return "just now";

  if (absMs < MS_PER_HOUR) {
    const minutes = Math.floor(absMs / MS_PER_MINUTE);
    return isFuture ? `in ${minutes}m` : `${minutes}m ago`;
  }

  if (absMs < MS_PER_DAY) {
    const hours = Math.floor(absMs / MS_PER_HOUR);
    return isFuture ? `in ${hours}h` : `${hours}h ago`;
  }

  const days = Math.floor(absMs / MS_PER_DAY);
  if (days === 1) return isFuture ? "tomorrow" : "yesterday";
  return isFuture ? `in ${days}d` : `${days}d ago`;
}

/**
 * Formats a timestamp as a precise, locale-stable absolute date and time.
 *
 * Intended for the `title`/tooltip companion to {@link formatRelativeTime}, so
 * the exact instant stays available to anyone who needs it.
 *
 * @param dateLike - A `Date` instance or a parsable date string.
 * @returns A string such as `"Jul 29, 2026, 3:00 PM"`, or an empty string when
 * `dateLike` is not a valid date.
 */
export function formatAbsoluteDateTime(
  dateLike: Date | string | null | undefined,
): string {
  const date = toValidDate(dateLike);
  if (!date) return "";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Returns the machine-readable ISO 8601 value for a `<time dateTime>` attribute.
 *
 * @param dateLike - A `Date` instance or a parsable date string.
 * @returns The ISO 8601 string, or `undefined` when `dateLike` is not a valid
 * date, so the attribute can be omitted entirely rather than emitted empty.
 */
export function toIsoDateTime(
  dateLike: Date | string | null | undefined,
): string | undefined {
  const date = toValidDate(dateLike);
  return date ? date.toISOString() : undefined;
}

/**
 * Reads the user's saved timezone preference from localStorage.
 * Falls back to the browser's local IANA timezone when no preference is set.
 */
export function getSavedTimezone(): string {
  const saved = safeStorage.getItem(STORAGE_KEYS.TIMEZONE);
  if (saved) return saved;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Combines a date string and a 12-hour time string into an ISO-8601 UTC
 * timestamp (e.g. "2023-04-12T09:32:00.000Z").
 *
 * Supports times in "hh:mmAM"/"hh:mm PM" format.
 */
export function getTransactionTimestamp(date: string, time = ""): string {
  const fallback = `${date}T00:00:00.000Z`;
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);

  if (!match) return fallback;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return fallback;

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

/**
 * Formats a date+time pair (as stored in Transaction) using the user's saved
 * timezone preference (or the browser's local timezone as fallback).
 *
 * Returns `{ date, time }` strings suitable for display.
 *
 * Falls back to the original date/time strings when the timestamp cannot be parsed.
 */
export function formatTransactionDateTime(
  date: string,
  time: string,
  timezone?: string,
): { date: string; time: string; timestamp: string } {
  const tz = timezone ?? getSavedTimezone();
  const timestamp = getTransactionTimestamp(date, time);
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return { date, time, timestamp };
  }

  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: tz,
    }).format(parsed);

    const parts = formatted.split(", ");
    // "Jul 29, 2026, 10:30 AM" -> datePart: "Jul 29, 2026", timePart: "10:30 AM"
    const datePart = parts.slice(0, -1).join(", ");
    const timePart = parts[parts.length - 1] ?? time;

    return {
      date: datePart || date,
      time: timePart || time,
      timestamp,
    };
  } catch {
    return { date, time, timestamp };
  }
}

/**
 * Formats a date with timezone-aware output using {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat | Intl.DateTimeFormat}.
 *
 * Falls back gracefully when the timezone is invalid (returns a no-timezone format).
 *
 * @param date - The date to format.
 * @param timezone - An IANA timezone identifier (e.g. `"Africa/Lagos"`).
 * @returns A human-readable date/time string such as `"Jul 29, 2026, 10:30 AM WAT"`.
 */
export function formatDateTimeWithTimezone(
  date: Date,
  timezone: string,
): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(date);
  } catch {
    // Fall back to no-timezone formatting when the runtime rejects the
    // timezone identifier (e.g. an unsupported IANA zone).
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

