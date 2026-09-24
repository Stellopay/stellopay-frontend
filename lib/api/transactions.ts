/**
 * @fileoverview Typed async data-access layer for transactions.
 * All UI components must import from here — never from mock-data directly.
 *
 * Swapping to a real backend is a one-file change:
 * replace the mock return with a fetch() call to NEXT_PUBLIC_API_BASE_URL.
 */

import type {
  Transaction,
  TransactionFilters,
  SortField,
  SortConfig,
} from "@/types/transaction";
import { allTransactions } from "@/lib/transactions";
import {
  filterTransactions,
} from "@/utils/transactionUtils";
import {
  parseAccountSummary,
  parseCursorPaginatedTransactions,
  parsePaginatedTransactions,
} from "./response-validation";

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetTransactionsParams {
  filters?: Partial<TransactionFilters>;
  page?: number;
  pageSize?: number;
}

/**
 * A single page of cursor-based (keyset) pagination.
 *
 * Unlike offset-based pages, a cursor identifies *where the previous page
 * ended* in a stable order, so records deleted or reordered between requests
 * cannot shift the window and cause duplicates or skips.
 *
 * - {@link CursorPaginatedTransactions.nextCursor}: an opaque token that must
 *   be passed back as {@link GetTransactionsCursorParams.cursor} to fetch the
 *   next page. It is `null` when there are no more records — this is the
 *   end-of-list signal.
 * - {@link CursorPaginatedTransactions.hasMore}: short-hand for
 *   `nextCursor !== null`.
 * - {@link CursorPaginatedTransactions.total}: the total number of matching
 *   records (independent of pagination), for building page-number UIs.
 */
export interface CursorPaginatedTransactions {
  data: Transaction[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface GetTransactionsCursorParams {
  filters?: Partial<TransactionFilters>;
  /** Opaque cursor from a previous page. Omitting it starts from the first record. */
  cursor?: string | null;
  pageSize?: number;
}

export const MIN_TRANSACTION_PAGE_SIZE = 1;
export const MAX_TRANSACTION_PAGE_SIZE = 100;
export const DEFAULT_TRANSACTION_PAGE_SIZE = 6;

// Wide date range that includes all mock data when no range is specified
const MOCK_FROM_DATE = "2000-01-01";
const MOCK_TO_DATE = "2099-12-31";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizePositiveInteger = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return clamp(Math.trunc(numericValue), min, max);
};

const normalizeDateFilter = (
  value: string | undefined,
  fallback: string,
  fieldName: "fromDate" | "toDate",
) => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError(
      `Invalid ${fieldName}: expected a parseable date string.`,
    );
  }

  return value;
};

// ── Stable ordering + keyset pagination helpers ────────────────────────────
//
// Offset-based pagination ("slice index n..n+pageSize") duplicates or skips
// rows whenever the underlying dataset is reordered or has records deleted
// between requests. To make pagination resilient we:
//
// 1. Sort by a *stable total order* — the caller's sort criteria plus an `id`
//    tiebreaker — so every record has a unique, deterministic position.
// 2. Paginate by *keyset*: the returned cursor captures the boundary record's
//    sort values + id, and the next request continues strictly after that
//    boundary by comparison, not by a fragile absolute index. Deleting
//    earlier records never shifts the window.
// 3. Deduplicate by identity (`id`), and expose an explicit end-of-list signal
//    (`nextCursor === null` / `hasMore === false`) so a repeated cursor can
//    never spin into an infinite request loop.

/** A normalized, comparable sort-key value for a single sort field. */
type CursorSortValue = number | string;

/** Encodes a record's position in the stable order for keyset resumption. */
interface CursorPayload {
  /** Normalized sort-key values, one per sort config (in config order). */
  values: CursorSortValue[];
  /** Boundary record id (final tiebreaker — unique). */
  id: string;
}

const normalizeSortValue = (
  transaction: Transaction,
  field: SortField,
): CursorSortValue => {
  switch (field) {
    case "date": {
      const parsed = new Date(transaction.date);
      const time = Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      return time;
    }
    case "amount": {
      const amount = Math.abs(transaction.amount);
      return Number.isFinite(amount) ? amount : 0;
    }
    case "type":
      return transaction.type;
    case "status":
      return transaction.status;
    default:
      return transaction.status;
  }
};

const compareCursorValues = (a: CursorSortValue, b: CursorSortValue): number => {
  if (typeof a === "number" && typeof b === "number") {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
};

const compareStable = (
  aValues: CursorSortValue[],
  aId: string,
  bValues: CursorSortValue[],
  bId: string,
  sortConfigs: SortConfig[],
): number => {
  for (let i = 0; i < sortConfigs.length; i += 1) {
    const raw = compareCursorValues(aValues[i], bValues[i]);
    if (raw !== 0) {
      return sortConfigs[i].direction === "asc" ? raw : -raw;
    }
  }
  // Id is the deterministic total order tiebreaker, always ascending.
  return aId < bId ? -1 : aId > bId ? 1 : 0;
};

const stableSort = (
  transactions: Transaction[],
  sortConfigs: SortConfig[],
): { transaction: Transaction; values: CursorSortValue[] }[] => {
  const decorated = transactions.map((transaction) => ({
    transaction,
    values: sortConfigs.map(({ field }) => normalizeSortValue(transaction, field)),
  }));

  return decorated.sort((a, b) =>
    compareStable(
      a.values,
      a.transaction.id,
      b.values,
      b.transaction.id,
      sortConfigs,
    ),
  );
};

const encodeCursor = (payload: CursorPayload): string =>
  encodeURIComponent(JSON.stringify(payload));

/**
 * Decodes an opaque pagination cursor.
 * Returns `null` for a missing cursor, an invalid token, or a malformed
 * payload — an untrusted/invalid cursor is treated as "start from the
 * beginning" rather than throwing or looping.
 */
const decodeCursor = (cursor: string | null | undefined): CursorPayload | null => {
  if (cursor === undefined || cursor === null || cursor === "") return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(cursor));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as CursorPayload).values) ||
      typeof (parsed as CursorPayload).id !== "string"
    ) {
      return null;
    }
    return parsed as CursorPayload;
  } catch {
    return null;
  }
};

const DEFAULT_SORT_CONFIGS: readonly SortConfig[] = [
  { field: "date", direction: "desc" },
];

/** Normalizes sort configs to a non-empty list (falling back to the default). */
const normalizeSortConfigs = (
  sortConfigs: SortConfig[] | undefined,
): SortConfig[] =>
  sortConfigs && sortConfigs.length > 0
    ? sortConfigs
    : [...DEFAULT_SORT_CONFIGS];

/** Applies filters, validates date filters, and sorts into a stable total order. */
const stableSortFilter = (
  filters: Partial<TransactionFilters>,
): { transaction: Transaction; values: CursorSortValue[] }[] => {
  const {
    searchQuery = "",
    filterQuery = "",
    selectedFilter = "All Transactions",
    fromDate = MOCK_FROM_DATE,
    toDate = MOCK_TO_DATE,
    minAmount,
    maxAmount,
    counterparty,
  } = filters;

  const safeFromDate = normalizeDateFilter(fromDate, MOCK_FROM_DATE, "fromDate");
  const safeToDate = normalizeDateFilter(toDate, MOCK_TO_DATE, "toDate");

  const filtered = filterTransactions(
    allTransactions,
    searchQuery,
    selectedFilter,
    safeFromDate,
    safeToDate,
    filterQuery,
    minAmount,
    maxAmount,
    counterparty,
  );

  return stableSort(filtered, normalizeSortConfigs(filters.sortConfigs));
};

/**
 * Shared abortable dev-mode delay used by the resilient pagination API so the
 * demo UI exercises its loading states. When `signal` fires mid-delay (or is
 * already aborted), it rejects with a `DOMException` whose `.name` is
 * `"AbortError"`.
 */
const abortableDelay = (signal?: AbortSignal): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => resolve(), 400);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });

/**
 * Fetch a page of transactions using resilient keyset (cursor) pagination.
 *
 * Every page returns an opaque {@link CursorPaginatedTransactions.nextCursor}
 * that must be passed back via {@link GetTransactionsCursorParams.cursor}.
 * Because pagination resumes "after this boundary record" in a stable
 * total order (sort criteria + `id` tiebreaker) rather than by a numeric
 * offset:
 *
 * - **Deletion resilience** — a record deleted between requests cannot shift
 *   the window; the next page continues after the boundary by comparison.
 * - **No duplicates** — identity is the total-order tiebreaker and each page
 *   is deduplicated by `id`, so adjacent pages never render the same id.
 * - **End-of-list policy** — when fewer than `pageSize` records remain (or
 *   none), `nextCursor` is `null` so `hasMore` is `false`. Passing a repeated
 *   cursor deterministically returns the same page, so callers can never
 *   trigger an infinite request loop.
 *
 * An invalid or missing cursor is treated as "first page".
 *
 * @throws {RangeError} When `filters.fromDate` or `filters.toDate` is
 *   non-empty and cannot be parsed as a valid date.
 */
export async function getTransactionsCursor(
  params: GetTransactionsCursorParams = {},
  signal?: AbortSignal,
): Promise<CursorPaginatedTransactions> {
  const { filters = {}, cursor, pageSize: requestedPageSize } = params;

  const safePageSize = normalizePositiveInteger(
    requestedPageSize,
    DEFAULT_TRANSACTION_PAGE_SIZE,
    MIN_TRANSACTION_PAGE_SIZE,
    MAX_TRANSACTION_PAGE_SIZE,
  );

  if (process.env.NODE_ENV === "development") {
    await abortableDelay(signal);
  }
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const sortConfigs = normalizeSortConfigs(filters.sortConfigs);
  const appliedStable = stableSortFilter(filters);

  // Only consider records strictly after the boundary cursor (keyset window).
  const boundary = decodeCursor(cursor);
  let window = appliedStable;
  if (boundary) {
    window = appliedStable.filter(({ transaction, values }) =>
      compareStable(
        values,
        transaction.id,
        boundary.values,
        boundary.id,
        sortConfigs,
      ) > 0,
    );
  }

  const page = window.slice(0, safePageSize);
  const remaining = window.length - page.length;
  const last = page[page.length - 1];

  return parseCursorPaginatedTransactions({
    data: page.map(({ transaction }) => transaction),
    total: appliedStable.length,
    nextCursor:
      remaining > 0 && last
        ? encodeCursor({ values: last.values, id: last.transaction.id })
        : null,
    hasMore: remaining > 0,
  });
}

/**
 * Fetch a paginated, filtered, sorted list of transactions.
 *
 * Treats pagination and date filters as untrusted boundary inputs so the same
 * contract remains safe when this demo data source is swapped for a backend.
 * `page` is truncated to an integer and clamped to `>= 1`, then clamped again
 * to the available page range. `pageSize` is truncated and clamped to the
 * inclusive range `MIN_TRANSACTION_PAGE_SIZE` through
 * `MAX_TRANSACTION_PAGE_SIZE`. Empty date filters are treated as unset and
 * replaced with the mock-data defaults; non-empty date filters must parse to a
 * valid JavaScript `Date`.
 *
 * Today returns mock data; swap the body for a fetch() when the backend is ready.
 *
 * ---
 *
 * ### AbortSignal / cancellation contract
 *
 * The caller is responsible for creating and owning the `AbortController`.
 * Pass `controller.signal` as the second argument and call `controller.abort()`
 * whenever the result is no longer needed (e.g. on React effect cleanup, route
 * change, or component unmount).
 *
 * **When abort fires:**
 *
 * - *During the dev-mode delay* — the internal `setTimeout` is cleared and the
 *   delay promise rejects with `new DOMException("Aborted", "AbortError")`,
 *   which propagates out of `getTransactions` immediately.
 * - *After the delay, before the synchronous computation begins* — the
 *   `signal.aborted` guard at the top of the synchronous section throws
 *   `new DOMException("Aborted", "AbortError")` before any filtering or
 *   sorting work is performed.
 * - *In production (no delay)* — only the post-delay `signal.aborted` guard
 *   applies; when wired to a real `fetch()`, pass the signal directly to
 *   `fetch()` so the network request is cancelled by the browser as well.
 *
 * **What the caller receives on abort:**
 *
 * The returned `Promise` rejects with a `DOMException` whose `.name` is
 * `"AbortError"`. Callers **must not** surface this to the user — it is a
 * normal part of the cancellation lifecycle. Check `err.name === "AbortError"`
 * (or `signal.aborted`) and silently discard the rejection.
 *
 * **When no signal is provided:**
 *
 * The `signal` parameter is optional. Omitting it disables cancellation
 * support; the promise will always run to completion. This is safe for
 * one-off, non-reactive call sites.
 *
 * @example
 * ```ts
 * // React effect — cancel when filters change or component unmounts
 * useEffect(() => {
 *   const controller = new AbortController();
 *
 *   getTransactions({ filters, page, pageSize }, controller.signal)
 *     .then(setData)
 *     .catch((err) => {
 *       if (err?.name === "AbortError") return; // expected; discard
 *       setError(err.message);
 *     });
 *
 *   return () => controller.abort();
 * }, [filters, page, pageSize]);
 * ```
 *
 * @param params - Optional transaction filters and pagination values.
 * @param signal - Optional `AbortSignal` from an `AbortController` owned by
 *   the caller. When the signal fires, the function rejects with a
 *   `DOMException` whose `.name` is `"AbortError"`.
 * @returns The validated page of transactions with pagination metadata.
 * @throws {RangeError} When `filters.fromDate` or `filters.toDate` is
 *   non-empty and cannot be parsed as a valid date.
 * @throws {DOMException} With `.name === "AbortError"` when the provided
 *   `signal` is aborted before or during execution.
 */
export async function getTransactions(
  params: GetTransactionsParams = {},
  signal?: AbortSignal,
): Promise<PaginatedTransactions> {
  const {
    filters = {},
    page: requestedPage = 1,
    pageSize: requestedPageSize = DEFAULT_TRANSACTION_PAGE_SIZE,
  } = params;

  const safePageSize = normalizePositiveInteger(
    requestedPageSize,
    DEFAULT_TRANSACTION_PAGE_SIZE,
    MIN_TRANSACTION_PAGE_SIZE,
    MAX_TRANSACTION_PAGE_SIZE,
  );
  const requestedSafePage = normalizePositiveInteger(
    requestedPage,
    1,
    1,
    Number.MAX_SAFE_INTEGER,
  );

  // ── Real backend swap point ──────────────────────────────────────────────
  // const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  // const res = await fetch(`${base}/transactions?page=${requestedSafePage}&pageSize=${safePageSize}&...`);
  // if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  // const json = await res.json();
  // return TransactionResponseSchema.parse(json); // zod validation here
  // ─────────────────────────────────────────────────────────────────────────

  // Abortable delay (used by tests and prevents stale UI flashes)
  if (process.env.NODE_ENV === "development") {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => resolve(), 400);

      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(new DOMException("Aborted", "AbortError"));
      };

      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const stableOrder = stableSortFilter(filters);

  const total = stableOrder.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(requestedSafePage, totalPages);
  const start = (safePage - 1) * safePageSize;
  const data = stableOrder
    .slice(start, start + safePageSize)
    .map(({ transaction }) => transaction);

  return parsePaginatedTransactions({
    data,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  });
}

export interface AccountSummary {
  balance: string;
  balanceRaw: number;
  paidThisMonth: string;
  paidThisMonthCount: number;
  toBePaid: string;
  toBePaidCount: number;
  walletAddress: string;
}

/**
 * Fetch the account summary displayed on the dashboard.
 */
export async function getAccountSummary(): Promise<AccountSummary> {
  if (process.env.NODE_ENV === "development") {
    await new Promise((r) => setTimeout(r, 400));
  }

  return parseAccountSummary({
    balance: "$ 2,432 USDC",
    balanceRaw: 2432,
    paidThisMonth: "$ 0",
    paidThisMonthCount: 0,
    toBePaid: "$ 0",
    toBePaidCount: 0,
    walletAddress: "BaDE1b23U45...67890UzZ",
  });
}

export interface PaymentHistoryItem {
  id: string;
  paymentDescription: string;
  paymentId: string;
  history: string;
}

/**
 * Fetch recent payment history notifications for the dashboard sidebar.
 */
export async function getPaymentHistory(): Promise<PaymentHistoryItem[]> {
  if (process.env.NODE_ENV === "development") {
    await new Promise((r) => setTimeout(r, 400));
  }

  return [
    {
      id: "ph-1",
      paymentDescription: "Payment Sent",
      paymentId: "#TXN12345",
      history: "Your payment of 250 XLM to...",
    },
    {
      id: "ph-2",
      paymentDescription: "Payment Received",
      paymentId: "#TXN12345",
      history: "You've received 500 USDC....",
    },
    {
      id: "ph-3",
      paymentDescription: "Low Balance Alert",
      paymentId: "",
      history: "Your balance is below 50 XLM. Consider adding...",
    },
  ];
}
