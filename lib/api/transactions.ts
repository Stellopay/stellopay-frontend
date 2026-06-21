/**
 * @fileoverview Typed async data-access layer for transactions.
 * All UI components must import from here — never from mock-data directly.
 *
 * Swapping to a real backend is a one-file change:
 * replace the mock return with a fetch() call to NEXT_PUBLIC_API_BASE_URL.
 */

import type { Transaction, TransactionFilters } from "@/types/transaction";
import { allTransactions } from "@/lib/transactions";
import { TRANSACTIONS_PAGE_SIZE } from "@/lib/transactionDefaults";
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

// Wide date range that includes all mock data when no range is specified
const MOCK_FROM_DATE = "2000-01-01";
const MOCK_TO_DATE = "2099-12-31";

/**
 * Fetch a paginated, filtered, sorted list of transactions.
 * Today returns mock data; swap the body for a fetch() when the backend is ready.
 */
export async function getTransactions(
  params: GetTransactionsParams = {},
): Promise<PaginatedTransactions> {
  const { filters = {}, page = 1, pageSize = TRANSACTIONS_PAGE_SIZE } = params;

  const {
    searchQuery = "",
    selectedFilter = "All Transactions",
    fromDate = MOCK_FROM_DATE,
    toDate = MOCK_TO_DATE,
    sortField = "date",
    sortDirection = "desc",
  } = filters;

  // ── Real backend swap point ──────────────────────────────────────────────
  // const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  // const res = await fetch(`${base}/transactions?page=${page}&pageSize=${pageSize}&...`);
  // if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  // const json = await res.json();
  // return TransactionResponseSchema.parse(json); // zod validation here
  // ─────────────────────────────────────────────────────────────────────────

  if (process.env.NODE_ENV === "development") {
    await new Promise((r) => setTimeout(r, 400));
  }

  const filtered = filterTransactions(
    allTransactions,
    searchQuery,
    selectedFilter,
    fromDate || MOCK_FROM_DATE,
    toDate || MOCK_TO_DATE,
  );

  const sorted = sortTransactions(filtered, sortField, sortDirection);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const data = sorted.slice(start, start + pageSize);

  return { data, total, page: safePage, pageSize, totalPages };
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
