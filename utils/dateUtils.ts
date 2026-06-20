/**
 * Date utility functions
 */
import { isValid, isWithinInterval, parse } from "date-fns";

/**
 * Formats a date string to a readable format (e.g., "Jan 15, 2024")
 * @param dateStr - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Formats a date to YYYY-MM-DD format for form inputs
 * @param date - The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Formats a date to DD-MM-YYYY format for display
 * @param date - The date to format
 * @returns Date string in DD-MM-YYYY format
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Parses transaction date labels such as "Apr 12, 2023".
 * @param dateString - Transaction date label to parse
 * @returns Parsed Date or null when the label is invalid
 */
export const parseTransactionDate = (dateString: string): Date | null => {
  try {
    const parsed = parse(dateString, "MMM dd, yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Checks if a date is within a given range
 * @param date - The date to check, or a transaction date label
 * @param fromDate - Start of the range
 * @param toDate - End of the range
 * @returns True if date is within range, false otherwise
 */
export function isDateInRange(
  date: Date,
  fromDate: Date,
  toDate: Date,
): boolean;
export function isDateInRange(
  date: string,
  fromDate?: Date,
  toDate?: Date,
): boolean;
export function isDateInRange(
  date: Date | string,
  fromDate: Date,
  toDate: Date,
): boolean;
export function isDateInRange(
  date: Date | string,
  fromDate?: Date,
  toDate?: Date,
): boolean {
  if (typeof date === "string") {
    const parsedDate = parseTransactionDate(date);

    if (!parsedDate) return true;
    if (!fromDate && !toDate) return true;
    if (fromDate && !toDate) return parsedDate >= fromDate;
    if (!fromDate && toDate) return parsedDate <= toDate;
    if (fromDate && toDate) {
      return isWithinInterval(parsedDate, { start: fromDate, end: toDate });
    }
    return true;
  }

  if (!fromDate || !toDate) return true;
  return date >= fromDate && date <= toDate;
}

/**
 * Gets the current date in YYYY-MM-DD format
 * @returns Current date string
 */
export const getCurrentDate = (): string => {
  return formatDateForInput(new Date());
};
