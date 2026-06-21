import type {
  Transaction,
  SortField,
  SortDirection,
} from "@/types/transaction";
import { formatCurrency } from "./formatUtils";
import { formatDate } from "./dateUtils";

type TransactionStatusColorKey = "completed" | "pending" | "failed" | "unknown";

/**
 * Fixed status-to-class palette for transaction badges.
 * Known status outputs are kept stable while unexpected statuses use
 * a separate fallback so bad data is visually distinct from "unknown".
 */
export const TRANSACTION_STATUS_COLOR_CLASSES = {
  completed: "bg-[#102B19] text-[#04842E]",
  pending: "bg-[#191919] text-[#9F6603]",
  failed: "bg-[#1A1A1A] text-[#B70B05]",
  unknown: "bg-[#1A1A1A] text-[#E5E5E5]",
} as const satisfies Record<TransactionStatusColorKey, string>;

const UNEXPECTED_STATUS_COLOR_CLASS = "bg-white text-black";

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
 * Gets the status color for a transaction status from a fixed palette.
 * Unexpected statuses never get interpolated into class names.
 * @param status - Transaction status
 * @returns Color class name for the status
 */
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus in TRANSACTION_STATUS_COLOR_CLASSES) {
    return TRANSACTION_STATUS_COLOR_CLASSES[
      normalizedStatus as TransactionStatusColorKey
    ];
  }

  return UNEXPECTED_STATUS_COLOR_CLASS;
};
