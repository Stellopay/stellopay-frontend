import type {
  Transaction,
  SortField,
  SortDirection,
} from "@/types/transaction";
import { formatCurrency } from "./formatUtils";
import { formatDate } from "./dateUtils";

type SortableTransactionField = Extract<keyof Transaction, SortField>;
type TransactionSortValue = Date | number | string;

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

const getTransactionSortValue = (
  transaction: Transaction,
  sortField: SortableTransactionField,
): TransactionSortValue | null => {
  switch (sortField) {
    case "date":
      return new Date(transaction.date);
    case "amount":
      return Math.abs(transaction.amount);
    case "type":
      return transaction.type;
    case "status":
      return transaction.status;
    default:
      return null;
  }
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
    const aValue = getTransactionSortValue(a, sortField);
    const bValue = getTransactionSortValue(b, sortField);

    if (aValue === null || bValue === null) return 0;

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
};

/**
 * Gets the status color for a transaction status
 * @param status - Transaction status
 * @returns Color class name for the status
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-[#102B19] text-[#04842E]";
    case "pending":
      return "bg-[#191919] text-[#9F6603]";
    case "failed":
      return "bg-[#1A1A1A] text-[#B70B05]";
    default:
      return "bg-[#1A1A1A] text-[#E5E5E5]";
  }
};
