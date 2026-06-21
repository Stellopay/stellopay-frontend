import type { TransactionFilters } from "@/types/transaction";

export const TRANSACTIONS_PAGE_SIZE = 6;

/**
 * Leave the date range unset so the initial transaction view is not anchored
 * to a stale historical window.
 */
export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  searchQuery: "",
  fromDate: "",
  toDate: "",
  selectedFilter: "All Transactions",
  sortField: "date",
  sortDirection: "desc",
};
