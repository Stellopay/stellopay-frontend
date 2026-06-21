/**
 * @fileoverview Typed async data-access layer for transactions.
 * All UI components must import from here — never from mock-data directly.
 *
 * Swapping to a real backend is a one-file change:
 * replace the mock return with a fetch() call to NEXT_PUBLIC_API_BASE_URL.
 */

import type { Transaction, TransactionFilters } from "@/types/transaction";
import { allTransactions } from "@/lib/transactions";
import { filterTransactions, sortTransactions } from "@/utils/transactionUtils";

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

type RemoteTransactionsResponse = Partial<PaginatedTransactions> & {
  transactions?: Transaction[];
};

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

type NormalizedTransactionFilters = {
  searchQuery: string;
  selectedFilter: string;
  fromDate: string;
  toDate: string;
  sortField: TransactionFilters["sortField"];
  sortDirection: TransactionFilters["sortDirection"];
};

const buildTransactionsUrl = (
  baseUrl: string,
  page: number,
  pageSize: number,
  filters: NormalizedTransactionFilters,
) => {
  const url = new URL("/transactions", baseUrl);

  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("searchQuery", filters.searchQuery);
  url.searchParams.set("selectedFilter", filters.selectedFilter);
  url.searchParams.set("fromDate", filters.fromDate);
  url.searchParams.set("toDate", filters.toDate);
  url.searchParams.set("sortField", filters.sortField);
  url.searchParams.set("sortDirection", filters.sortDirection);

  return url;
};

const normalizeRemoteTransactions = (
  response: RemoteTransactionsResponse,
  fallbackPage: number,
  fallbackPageSize: number,
): PaginatedTransactions => {
  const data = response.data ?? response.transactions ?? [];
  const total = response.total ?? data.length;
  const pageSize = response.pageSize ?? fallbackPageSize;

  return {
    data,
    total,
    page: response.page ?? fallbackPage,
    pageSize,
    totalPages: response.totalPages ?? Math.max(1, Math.ceil(total / pageSize)),
  };
};

const fetchRemoteTransactions = async (
  baseUrl: string,
  page: number,
  pageSize: number,
  filters: NormalizedTransactionFilters,
  signal?: AbortSignal,
): Promise<PaginatedTransactions> => {
  const response = await fetch(
    buildTransactionsUrl(baseUrl, page, pageSize, filters),
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }

  return normalizeRemoteTransactions(
    (await response.json()) as RemoteTransactionsResponse,
    page,
    pageSize,
  );
};

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
 * @param params - Optional transaction filters and pagination values.
 * @returns The validated page of transactions with pagination metadata.
 * @throws RangeError When `filters.fromDate` or `filters.toDate` is non-empty
 * and cannot be parsed as a valid date.
 */
export async function getTransactions(
  params: GetTransactionsParams = {},
  signal?: AbortSignal
): Promise<PaginatedTransactions> {
  const {
    filters = {},
    page: requestedPage = 1,
    pageSize: requestedPageSize = DEFAULT_TRANSACTION_PAGE_SIZE,
  } = params;

  const {
    searchQuery = "",

    selectedFilter = "All Transactions",
    fromDate = MOCK_FROM_DATE,
    toDate = MOCK_TO_DATE,
    sortField = "date",
    sortDirection = "desc",
  } = filters;

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
  const safeFromDate = normalizeDateFilter(
    fromDate,
    MOCK_FROM_DATE,
    "fromDate",
  );
  const safeToDate = normalizeDateFilter(toDate, MOCK_TO_DATE, "toDate");

  // ── Real backend swap point ──────────────────────────────────────────────
  // const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  // const res = await fetch(`${base}/transactions?page=${requestedSafePage}&pageSize=${safePageSize}&...`);
  // if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  // const json = await res.json();
  // return TransactionResponseSchema.parse(json); // zod validation here
  // ─────────────────────────────────────────────────────────────────────────

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (apiBaseUrl) {
    return fetchRemoteTransactions(
      apiBaseUrl,
      requestedSafePage,
      safePageSize,
      {
        searchQuery,
        selectedFilter,
        fromDate: safeFromDate,
        toDate: safeToDate,
        sortField,
        sortDirection,
      },
      signal,
    );
  }

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

  const filtered = filterTransactions(

    allTransactions,
    searchQuery,
    selectedFilter,
    safeFromDate,
    safeToDate,
  );

  const sorted = sortTransactions(filtered, sortField, sortDirection);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(requestedSafePage, totalPages);
  const start = (safePage - 1) * safePageSize;
  const data = sorted.slice(start, start + safePageSize);

  return { data, total, page: safePage, pageSize: safePageSize, totalPages };
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

  return {
    balance: "$ 2,432 USDC",
    balanceRaw: 2432,
    paidThisMonth: "$ 0",
    paidThisMonthCount: 0,
    toBePaid: "$ 0",
    toBePaidCount: 0,
    walletAddress: "BaDE1b23U45...67890UzZ",
  };
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
