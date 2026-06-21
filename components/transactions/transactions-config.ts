/**
 * Number of transaction rows displayed per page.
 *
 * This constant is the single source of truth shared between
 * {@link TransactionsContent} (pagination) and {@link TransactionsTable}
 * (skeleton row count) so the two values never drift apart.
 */
export const TRANSACTIONS_PAGE_SIZE = 6;

/**
 * Returns the default date filter range for the transactions view:
 * a 30-day window ending today.
 *
 * Implemented as a function rather than a module-level constant so that each
 * component mount derives dates relative to the actual current day instead of
 * reading a value frozen at bundle-load time.
 *
 * @returns An object with {@link fromDate} and {@link toDate} as ISO date
 *   strings in `YYYY-MM-DD` format, safe to pass directly to
 *   {@link TransactionFilters}.
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    fromDate: thirtyDaysAgo.toISOString().split("T")[0],
    toDate: today.toISOString().split("T")[0],
  };
}
