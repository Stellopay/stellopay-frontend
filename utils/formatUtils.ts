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
  decimals: number = 2,
): string => {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}${currency}${Math.abs(amount).toFixed(decimals)}`;
};

/**
 * Formats a number with thousands separators
 * @param num - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
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

/**
 * Formats an amount using the browser's {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat | Intl.NumberFormat}
 * with a real ISO 4217 currency code so that symbol placement, grouping, and
 * decimal separators match the user's locale-aware choice.
 *
 * Falls back gracefully for unknown currency codes by stripping the style.
 *
 * @param amount - Numeric amount to format.
 * @param currencyCode - ISO 4217 currency code (e.g. `"USD"`, `"NGN"`, `"EUR"`).
 * @returns Locale-formatted currency string such as `"$1,250.50"` or `"€1.250,50"`.
 */
export const formatCurrencyWithCode = (
  amount: number,
  currencyCode: string,
): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    // When the runtime doesn't recognise the currency code (unlikely for
    // the subset we surface, but defensive), fall back to plain decimal.
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
};
