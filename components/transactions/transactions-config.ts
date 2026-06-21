/**
 * Default page size shared by transactions pagination and loading skeletons.
 */
export const DEFAULT_TRANSACTIONS_PAGE_SIZE = 6;

/**
 * Empty defaults mean the initial transactions view is not pinned to a stale
 * historical date window; users can opt into date filtering from the header.
 */
export const DEFAULT_TRANSACTION_DATE_RANGE = {
  fromDate: "",
  toDate: "",
} as const;
