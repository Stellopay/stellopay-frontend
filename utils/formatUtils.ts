/**
 * Formatting utility functions
 */

/**
 * Formats a number as currency with proper sign
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: "$")
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = "$",
  decimals: number = 2
): string => {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${currency}${Math.abs(amount).toFixed(decimals)}`;
};

/**
 * Formats a number with thousands separators
 * @param num - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Formats a number for display in charts (e.g., 24000 -> "24k")
 * @param value - The number to format
 * @returns Formatted number string
 */
export const formatChartValue = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

/**
 * Truncates text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text string
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
};

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 */
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}; 