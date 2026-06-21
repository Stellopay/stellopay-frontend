/**
 * Number of transactions shown on each transactions page and in matching
 * loading skeleton rows.
 */
export const TRANSACTIONS_ITEMS_PER_PAGE = 6;

/**
 * Default date filters for the transactions view. Empty values intentionally
 * leave the range unset so the data layer can include the available history.
 */
export const TRANSACTIONS_DEFAULT_DATE_RANGE = {
  fromDate: "",
  toDate: "",
} as const;
