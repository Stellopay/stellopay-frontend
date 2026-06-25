import type {
  Transaction,
  SortField,
  SortDirection,
} from "@/types/transaction";
import { formatCurrency } from "./formatUtils";
import { formatDate } from "./date-utils";

type SortComparable = Date | number | string;

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

const invalidDate = new Date(0);

const normalizeDate = (value: Transaction["date"]): Date => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? invalidDate : date;
};

const normalizeAmount = (value: Transaction["amount"]): number => {
  const amount = Math.abs(value);
  return Number.isFinite(amount) ? amount : 0;
};

const getSortValue = (
  transaction: Transaction,
  sortField: SortField,
): SortComparable => {
  switch (sortField) {
    case "date":
      return normalizeDate(transaction.date);
    case "amount":
      return normalizeAmount(transaction.amount);
    case "type":
      return transaction.type;
    case "status":
      return transaction.status;
  }
};

const compareSortValues = (
  aValue: SortComparable,
  bValue: SortComparable,
): number => {
  if (aValue < bValue) return -1;
  if (aValue > bValue) return 1;
  return 0;
};

/**
 * Sorts transactions by a type-checked transaction field.
 *
 * Invalid dates and non-finite amounts are normalized to stable fallback values
 * so malformed transaction data cannot throw while rendering the sorted view.
 *
 * @param transactions - Array of transactions to sort
 * @param sortField - Transaction field to sort by (date, amount, type, status)
 * @param sortDirection - Sort direction (asc, desc)
 * @returns Sorted array of transactions
 */
export const sortTransactions = (
  transactions: Transaction[],
  sortField: SortField,
  sortDirection: SortDirection,
): Transaction[] => {
  return [...transactions].sort((a, b) => {
    const comparison = compareSortValues(
      getSortValue(a, sortField),
      getSortValue(b, sortField),
    );

    return sortDirection === "asc" ? comparison : -comparison;
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
  completed: "bg-[#102B19] text-[#04842E]",
  pending: "bg-[#191919] text-[#9F6603]",
  failed: "bg-[#1A1A1A] text-[#B70B05]",
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
