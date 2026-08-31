/**
 * @fileoverview Centralized filter/sort/pagination defaults and predicate
 * builders for the Transactions feature.
 *
 * This module is the single source of truth for:
 * - {@link TRANSACTIONS_PAGE_SIZE} — shared page-size constant.
 * - {@link getDefaultDateRange} — default 30-day date window.
 * - Individual filter predicate builders ({@link createSearchQueryPredicate},
 *   {@link createSelectedFilterPredicate}, etc.) — each returns a standalone
 *   `(transaction) => boolean` function that can be unit-tested in isolation.
 * - {@link applyTransactionFilters} — composes every active predicate with
 *   AND semantics, so a transaction must satisfy **all** active filters to be
 *   included.
 *
 * The predicate-builder pattern was chosen so that:
 * 1. Each filter rule is independently testable (see
 *    `transactions-config.test.ts`).
 * 2. The combined AND behavior is an explicit, documented composition rather
 *    than an emergent property of sequential `.filter()` calls.
 * 3. `utils/transactionUtils.ts › filterTransactions` delegates to these
 *    predicates, eliminating duplicated filter logic.
 */

import type { Transaction } from "@/types/transaction";

/**
 * Number of transaction rows displayed per page.
 *
 * This constant is the single source of truth shared between
 * {@link TransactionsContent} (pagination) and {@link TransactionsTable}
 * (skeleton row count) so the two values never drift apart.
 */
export const TRANSACTIONS_PAGE_SIZE = 6;

/**
 * The `selectedFilter` value that represents "no type filter". When the
 * filter equals this sentinel, the type predicate is a pass-all.
 */
export const DEFAULT_SELECTED_FILTER = "All Transactions";

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

// ── Individual filter predicate builders ─────────────────────────────────────
//
// Each builder accepts the relevant filter parameter(s) and returns a pure
// predicate `(transaction: Transaction) => boolean`. When the filter is
// inactive (empty / undefined / sentinel), the builder returns a pass-all
// predicate so it can be safely composed without conditional checks at the
// call site.

/**
 * Creates a predicate that matches transactions whose `type`, `txId`,
 * `address`, `token`, or `status` contains `searchQuery` (case-insensitive).
 *
 * Returns a pass-all predicate when `searchQuery` is empty.
 *
 * @param searchQuery - Substring to search across multiple fields.
 * @returns A predicate that returns `true` for matching transactions.
 */
export function createSearchQueryPredicate(
  searchQuery: string,
): (transaction: Transaction) => boolean {
  if (!searchQuery) {
    return () => true;
  }
  const query = searchQuery.toLowerCase();
  return (transaction) =>
    transaction.type.toLowerCase().includes(query) ||
    transaction.txId.toLowerCase().includes(query) ||
    transaction.address.toLowerCase().includes(query) ||
    transaction.token.toLowerCase().includes(query) ||
    transaction.status.toLowerCase().includes(query);
}

/**
 * Creates a predicate that matches transactions whose `type` exactly equals
 * `selectedFilter`.
 *
 * Returns a pass-all predicate when `selectedFilter` is
 * {@link DEFAULT_SELECTED_FILTER}. The match is case-sensitive to preserve
 * the historical contract.
 *
 * @param selectedFilter - Exact transaction type, or the default sentinel.
 * @returns A predicate that returns `true` for matching transactions.
 */
export function createSelectedFilterPredicate(
  selectedFilter: string,
): (transaction: Transaction) => boolean {
  if (selectedFilter === DEFAULT_SELECTED_FILTER) {
    return () => true;
  }
  return (transaction) => transaction.type === selectedFilter;
}

/**
 * Creates a predicate that matches transactions whose `type`, `status`, or
 * `address` contains `filterQuery` (case-insensitive, trimmed).
 *
 * Returns a pass-all predicate when `filterQuery` is empty or whitespace-only.
 *
 * @param filterQuery - Substring to search across type, status, and address.
 * @returns A predicate that returns `true` for matching transactions.
 */
export function createFilterQueryPredicate(
  filterQuery: string,
): (transaction: Transaction) => boolean {
  const normalized = filterQuery.trim().toLowerCase();
  if (!normalized) {
    return () => true;
  }
  return (transaction) =>
    transaction.type.toLowerCase().includes(normalized) ||
    transaction.status.toLowerCase().includes(normalized) ||
    transaction.address.toLowerCase().includes(normalized);
}

/**
 * Creates a predicate that matches transactions whose date falls within the
 * inclusive range `[fromDate, toDate]`.
 *
 * Both bounds are parsed with `new Date()`. Invalid date strings produce an
 * invalid `Date` whose comparisons are always `false`, so every transaction
 * is excluded — matching the historical `filterTransactions` contract.
 *
 * @param fromDate - Inclusive lower bound (`YYYY-MM-DD` or parseable date).
 * @param toDate - Inclusive upper bound (`YYYY-MM-DD` or parseable date).
 * @returns A predicate that returns `true` for transactions within the range.
 */
export function createDateRangePredicate(
  fromDate: string,
  toDate: string,
): (transaction: Transaction) => boolean {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return (transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= from && transactionDate <= to;
  };
}

/**
 * Creates a predicate that matches transactions whose absolute `amount` is
 * greater than or equal to `minAmount`.
 *
 * Returns a pass-all predicate when `minAmount` is `undefined`.
 *
 * @param minAmount - Minimum absolute amount, or `undefined` to skip.
 * @returns A predicate that returns `true` for transactions at or above the
 *   threshold.
 */
export function createMinAmountPredicate(
  minAmount?: number,
): (transaction: Transaction) => boolean {
  if (minAmount === undefined) {
    return () => true;
  }
  return (transaction) => Math.abs(transaction.amount) >= minAmount;
}

/**
 * Creates a predicate that matches transactions whose absolute `amount` is
 * less than or equal to `maxAmount`.
 *
 * Returns a pass-all predicate when `maxAmount` is `undefined`.
 *
 * @param maxAmount - Maximum absolute amount, or `undefined` to skip.
 * @returns A predicate that returns `true` for transactions at or below the
 *   threshold.
 */
export function createMaxAmountPredicate(
  maxAmount?: number,
): (transaction: Transaction) => boolean {
  if (maxAmount === undefined) {
    return () => true;
  }
  return (transaction) => Math.abs(transaction.amount) <= maxAmount;
}

/**
 * Creates a predicate that matches transactions whose `address` contains
 * `counterparty` (case-insensitive, trimmed).
 *
 * Returns a pass-all predicate when `counterparty` is empty or
 * whitespace-only.
 *
 * @param counterparty - Address substring, or `undefined`/empty to skip.
 * @returns A predicate that returns `true` for matching addresses.
 */
export function createCounterpartyPredicate(
  counterparty?: string,
): (transaction: Transaction) => boolean {
  if (!counterparty) {
    return () => true;
  }
  const normalized = counterparty.trim().toLowerCase();
  if (!normalized) {
    return () => true;
  }
  return (transaction) =>
    transaction.address.toLowerCase().includes(normalized);
}

// ── Combined filter (AND semantics) ──────────────────────────────────────────

/**
 * Options for {@link applyTransactionFilters}. Every field is optional; only
 * the filters that are present (non-`undefined`) are applied.
 */
export interface TransactionFilterOptions {
  /** Substring search across type, txId, address, token, and status. */
  searchQuery?: string;
  /** Quick-filter query across type, status, and address. */
  filterQuery?: string;
  /** Exact transaction-type filter. Defaults to {@link DEFAULT_SELECTED_FILTER}. */
  selectedFilter?: string;
  /** Inclusive lower date bound (`YYYY-MM-DD`). */
  fromDate?: string;
  /** Inclusive upper date bound (`YYYY-MM-DD`). */
  toDate?: string;
  /** Minimum absolute amount. */
  minAmount?: number;
  /** Maximum absolute amount. */
  maxAmount?: number;
  /** Counterparty address substring. */
  counterparty?: string;
}

/**
 * Applies all active transaction filters with **AND semantics**: a transaction
 * is included only when it satisfies every active predicate.
 *
 * A filter is "active" when its option is present (non-`undefined`). The
 * `selectedFilter` defaults to {@link DEFAULT_SELECTED_FILTER} (pass-all), and
 * the date range is applied only when **both** `fromDate` and `toDate` are
 * provided, so callers can test other predicates in isolation without a date
 * constraint.
 *
 * The input array is never mutated; a new filtered array is returned.
 *
 * @param transactions - The transaction array to filter.
 * @param options - Optional filter criteria.
 * @returns A new array containing only the transactions that satisfy all
 *   active filters.
 */
export function applyTransactionFilters(
  transactions: Transaction[],
  options: TransactionFilterOptions = {},
): Transaction[] {
  const {
    searchQuery = "",
    filterQuery = "",
    selectedFilter = DEFAULT_SELECTED_FILTER,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    counterparty,
  } = options;

  const predicates: Array<(transaction: Transaction) => boolean> = [
    createSearchQueryPredicate(searchQuery),
    createSelectedFilterPredicate(selectedFilter),
    createFilterQueryPredicate(filterQuery),
  ];

  // The date-range filter is applied only when both bounds are provided,
  // so callers can test other predicates in isolation without a date
  // constraint. When `filterTransactions` delegates, it always passes both
  // bounds (possibly empty strings), preserving the historical contract.
  if (fromDate !== undefined && toDate !== undefined) {
    predicates.push(createDateRangePredicate(fromDate, toDate));
  }

  predicates.push(
    createMinAmountPredicate(minAmount),
    createMaxAmountPredicate(maxAmount),
    createCounterpartyPredicate(counterparty),
  );

  return transactions.filter((transaction) =>
    predicates.every((predicate) => predicate(transaction)),
  );
}