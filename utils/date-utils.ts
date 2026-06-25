import { format, parse, isValid, startOfDay } from "date-fns";

/**
 * Single source of truth for date parsing, formatting, and range checks.
 *
 * Consolidates the legacy `utils/dateUtils.ts` (which used the
 * locale-dependent `Date.prototype.toLocaleDateString`) and the original
 * `utils/date-utils.ts` (date-fns based) into one module so formatting is
 * deterministic regardless of the host machine's locale.
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
  return format(date, "MMM dd, yyyy");
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

