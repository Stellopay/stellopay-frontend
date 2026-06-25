import type {
  Transaction,
  SortField,
  SortDirection,
} from "@/types/transaction";
import { formatCurrency } from "./formatUtils";
import { formatDate } from "./date-utils";

/**
 * Formats transaction amount with proper currency formatting
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatAmount = (amount: number): string => {
  return formatCurrency(amount);
};

/**
 * Formats transaction date for display
 * @param dateStr - The date string to format
 * @returns Formatted date string
 */
export const formatTransactionDate = (dateStr: string): string => {
  return formatDate(dateStr);
};

/**
 * Filters transactions based on search query, filter type, and date range
 * @param transactions - Array of transactions to filter
 * @param searchQuery - Search query string
 * @param selectedFilter - Filter type (e.g., "All Transactions", "Payment Sent")
 * @param fromDate - Start date for filtering
 * @param toDate - End date for filtering
 * @returns Filtered array of transactions
 */
export const filterTransactions = (
  transactions: Transaction[],
  searchQuery: string,
  selectedFilter: string,
  fromDate: string,
  toDate: string,
): Transaction[] => {
  let filtered = transactions;

  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(
      (transaction) =>
        transaction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.status.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  // Filter by transaction type
  if (selectedFilter !== "All Transactions") {
    filtered = filtered.filter(
      (transaction) => transaction.type === selectedFilter,
    );
  }

  // Filter by date range
  filtered = filtered.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return transactionDate >= from && transactionDate <= to;
  });

  return filtered;
};

/**
 * Sorts transactions by specified field and direction
 * @param transactions - Array of transactions to sort
 * @param sortField - Field to sort by (date, amount, type, status)
 * @param sortDirection - Sort direction (asc, desc)
 * @returns Sorted array of transactions
 */
export const sortTransactions = (
  transactions: Transaction[],
  sortField: SortField,
  sortDirection: SortDirection,
): Transaction[] => {
  return [...transactions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "date":
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case "amount":
        aValue = Math.abs(a.amount);
        bValue = Math.abs(b.amount);
        break;
      case "type":
        aValue = a.type;
        bValue = b.type;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
};

/**
 * Known, normalized (lowercase) transaction status keys with a defined
 * color treatment. Any other status falls back to {@link UNKNOWN_STATUS_COLOR}.
 */
export type KnownTransactionStatus = "completed" | "pending" | "failed";

/**
 * Single source of truth mapping each known transaction status to its
 * Tailwind background/text classes. Values are fixed literals — never
 * built from user input — so {@link getStatusColor} cannot be coerced into
 * emitting an arbitrary class string.
 *
 * Outputs are intentionally kept as the original hex-based classes for
 * backward compatibility with existing UI; new statuses should prefer
 * theme tokens (e.g. `bg-success`, `text-warning`) defined in
 * `app/globals.css` instead of raw hex where possible.
 */
export const STATUS_COLOR_PALETTE: Readonly<
  Record<KnownTransactionStatus, string>
> = {
  // Text colors are brightened from the original #04842E/#9F6603/#B70B05 —
  // those failed axe's WCAG AA color-contrast check (3.14:1, 3.67:1, 2.53:1
  // against their backgrounds; AA requires 4.5:1). These shades keep the
  // same green/amber/red hue family while clearing the threshold.
  completed: "bg-[#102B19] text-[#34D399]",
  pending: "bg-[#191919] text-[#FBBF24]",
  failed: "bg-[#1A1A1A] text-[#F87171]",
};

/**
 * Style used for any status not present in {@link STATUS_COLOR_PALETTE}.
 *
 * Deliberately distinct from every known status (dashed border + the
 * `warning` theme token) so unrecognized/bad status data is visually
 * obvious instead of blending in with a normal-looking pill.
 */
export const UNKNOWN_STATUS_COLOR =
  "bg-warning/10 text-warning border border-dashed border-warning/50";

/**
 * Gets the Tailwind color classes for a transaction status pill.
 *
 * The status string is matched case-insensitively against the fixed
 * {@link STATUS_COLOR_PALETTE} lookup table and is never interpolated into
 * the returned class string, so an unexpected status value can never
 * inject arbitrary classes.
 *
 * @param status - Transaction status
 * @returns Color class name for the status, or {@link UNKNOWN_STATUS_COLOR}
 * when the status isn't recognized
 */
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase() as KnownTransactionStatus;
  return STATUS_COLOR_PALETTE[normalizedStatus] ?? UNKNOWN_STATUS_COLOR;
};
