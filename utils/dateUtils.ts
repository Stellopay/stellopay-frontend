/**
 * Date utility functions
 */

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
  return date.toISOString().split('T')[0];
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
 * Checks if a date is within a given range
 * @param date - The date to check
 * @param fromDate - Start of the range
 * @param toDate - End of the range
 * @returns True if date is within range, false otherwise
 */
export const isDateInRange = (date: Date, fromDate: Date, toDate: Date): boolean => {
  return date >= fromDate && date <= toDate;
};

/**
 * Gets the current date in YYYY-MM-DD format
 * @returns Current date string
 */
export const getCurrentDate = (): string => {
  return formatDateForInput(new Date());
}; 