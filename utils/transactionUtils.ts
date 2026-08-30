import type {
  Transaction,
  SortField,
  SortDirection,
  SortConfig,
} from "@/types/transaction";
import { formatCurrency } from "./formatUtils";
import { formatDate } from "./date-utils";
import { applyTransactionFilters } from "@/components/transactions/transactions-config";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SortComparable = Date | number | string;

/**
 * Simple memoization helper that caches the last result based on a
 * serialised argument key. Only the most recent call is cached — this
 * is intentionally lightweight because the sort/filter pipeline is
 * called once per effect run in the transactions hook, not repeatedly
 * with many different argument combinations.
 */
function memoizeLast<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  let lastKey: string | undefined;
  let lastResult: Result | undefined;

  return (...args: Args): Result => {
    const key = JSON.stringify(args);
    if (key === lastKey && lastResult !== undefined) {
      return lastResult;
    }
    lastKey = key;
    lastResult = fn(...args);
    return lastResult as Result;
  };
}

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
 * Filters transactions based on search query, filter type, and date range.
 *
 * This function is a thin adapter that delegates to the centralized
 * {@link applyTransactionFilters} predicate composition in
 * `components/transactions/transactions-config.ts`. Keeping a single source of
 * truth for filter logic ensures the unit-tested AND semantics are reused
 * everywhere — the API layer, the UI, and any future callers.
 *
 * The positional signature is preserved for backward compatibility with
 * existing call sites (`lib/api/transactions.ts`).
 *
 * @param transactions - Array of transactions to filter
 * @param searchQuery - Search query string
 * @param selectedFilter - Filter type (e.g., "All Transactions", "Payment Sent")
 * @param fromDate - Start date for filtering (inclusive)
 * @param toDate - End date for filtering (inclusive)
 * @param filterQuery - Quick-filter query across type, status, and address
 * @param minAmount - Optional minimum absolute amount
 * @param maxAmount - Optional maximum absolute amount
 * @param counterparty - Optional counterparty address substring
 * @returns Filtered array of transactions
 */
export const filterTransactions = (
  transactions: Transaction[],
  searchQuery: string,
  selectedFilter: string,
  fromDate: string,
  toDate: string,
  filterQuery = "",
  minAmount?: number,
  maxAmount?: number,
  counterparty?: string,
): Transaction[] => {
  return applyTransactionFilters(transactions, {
    searchQuery,
    selectedFilter,
    fromDate,
    toDate,
    filterQuery,
    minAmount,
    maxAmount,
    counterparty,
  });
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
 * Sorts transactions by an ordered list of sort criteria (multi-column sort).
 *
 * When two transactions have equal values for the first criterion, the second
 * criterion is used as a tiebreaker, and so on through the list.
 *
 * Invalid dates and non-finite amounts are normalized to stable fallback values
 * so malformed transaction data cannot throw while rendering the sorted view.
 *
 * @param transactions - Array of transactions to sort
 * @param sortConfigs - Ordered list of (field, direction) pairs.
 *   The first entry is the primary sort; subsequent entries are tiebreakers.
 * @returns Sorted array of transactions
 */
export const sortTransactionsMulti = (
  transactions: Transaction[],
  sortConfigs: SortConfig[],
): Transaction[] => {
  if (sortConfigs.length === 0) {
    return [...transactions];
  }

  return [...transactions].sort((a, b) => {
    for (const { field, direction } of sortConfigs) {
      const comparison = compareSortValues(
        getSortValue(a, field),
        getSortValue(b, field),
      );

      if (comparison !== 0) {
        return direction === "asc" ? comparison : -comparison;
      }
    }

    return 0;
  });
};

/**
 * Sorts transactions by a single sort criterion.
 *
 * Delegates to {@link sortTransactionsMulti} with a single-element config array
 * so behaviour is identical to the previous single-key implementation.
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
  return sortTransactionsMulti(transactions, [{ field: sortField, direction: sortDirection }]);
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

/**
 * Applies the full filter → sort pipeline and returns the resulting array.
 *
 * This is the preferred entry-point for consumers that need both operations
 * in sequence; it is memoized so repeated calls with identical arguments
 * return the same array reference without re-executing the pipeline.
 *
 * @param transactions - Raw transaction array
 * @param searchQuery - Free-text search
 * @param selectedFilter - Dropdown filter label (e.g. "Payment Sent")
 * @param fromDate - Start date (ISO string)
 * @param toDate - End date (ISO string)
 * @param filterQuery - Additional filter query
 * @param minAmount - Minimum absolute amount
 * @param maxAmount - Maximum absolute amount
 * @param counterparty - Counterparty address substring
 * @param sortConfigs - Ordered sort criteria
 * @returns Filtered and sorted transaction array
 */
export const sortAndFilterTransactions = memoizeLast(
  (
    transactions: Transaction[],
    searchQuery: string,
    selectedFilter: string,
    fromDate: string,
    toDate: string,
    filterQuery: string,
    minAmount: number | undefined,
    maxAmount: number | undefined,
    counterparty: string | undefined,
    sortConfigs: SortConfig[],
  ): Transaction[] => {
    const filtered = filterTransactions(
      transactions,
      searchQuery,
      selectedFilter,
      fromDate,
      toDate,
      filterQuery,
      minAmount,
      maxAmount,
      counterparty,
    );
    return sortTransactionsMulti(filtered, sortConfigs);
  },
);

/**
 * Mapping each known transaction status to a distinct lucide-react icon.
 * These icons are paired with color badges so the status is communicated
 * through shape + label, not color alone (WCAG 1.4.1 Use of Color).
 */
export const STATUS_ICON_MAP: Readonly<
  Record<KnownTransactionStatus, LucideIcon>
> = {
  completed: CheckCircle2,
  pending: Clock,
  failed: XCircle,
};

/**
 * Icon used for unrecognised status values.
 */
export const UNKNOWN_STATUS_ICON: LucideIcon = AlertCircle;

/**
 * Returns a lucide-react icon component for the given transaction status.
 *
 * The returned component should be rendered with `aria-hidden="true"` since
 * the accompanying text already conveys the status.
 *
 * @param status - Transaction status string (case-insensitive)
 * @returns A lucide-react icon component
 */
export const getStatusIcon = (status: string): LucideIcon => {
  const normalizedStatus = status.toLowerCase() as KnownTransactionStatus;
  return STATUS_ICON_MAP[normalizedStatus] ?? UNKNOWN_STATUS_ICON;
};

/**
 * Removes duplicate transactions by their stable `id`, keeping the first
 * occurrence of each and preserving order.
 *
 * The backend can change between cursor requests (records reordered or
 * duplicated across page boundaries). Rendering deduplicates by identity so
 * the UI never shows the same transaction twice, even if a page contains a
 * row already returned by the previous page. When applied per page it is a
 * safety net on top of the cursor walk; when applied across a paginated
 * accumulation it guarantees a globally unique list.
 *
 * @param transactions - Transactions that may contain duplicate ids
 * @returns A new array with one entry per unique id (first occurrence)
 */
export const dedupeTransactionsById = <T extends { id: string }>(
  transactions: T[],
): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const transaction of transactions) {
    if (seen.has(transaction.id)) continue;
    seen.add(transaction.id);
    result.push(transaction);
  }
  return result;
};
