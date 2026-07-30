export interface Transaction {
  id: string;
  type: string;
  txId: string;
  address: string;
  date: string;
  time: string;
  token: string;
  amount: number;
  status: string;
  statusColor: "success" | "warning" | "destructive";
  memo?: string;
}

export type SortField = Extract<
  keyof Transaction,
  "date" | "amount" | "type" | "status"
>;
export type SortDirection = "asc" | "desc";

/**
 * A single sort criterion: which field to sort by and in which direction.
 */
export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface TransactionFilters {
  searchQuery: string;
  filterQuery: string;
  fromDate: string;
  toDate: string;
  selectedFilter: string;
  /** Optional minimum absolute transaction amount filter. */
  minAmount?: number;
  /** Optional maximum absolute transaction amount filter. */
  maxAmount?: number;
  /** Ordered list of sort criteria. The first entry is the primary sort,
   *  the second (if present) is the secondary (tiebreaker) sort, etc. */
  sortConfigs: SortConfig[];
  /** Counterparty address filter (partial match). */
  counterparty?: string;
  /** Tag names to filter by. Transactions matching any of these tags are shown. */
  tagFilter?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TransactionProps {
  id: string;
  type: string;
  txId: string;
  address: string;
  date: string;
  time: string;
  token: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed";
  tokenIcon: string;
  /** Optional memo/description for the transaction */
  memo?: string;
  /** Optional counterparty address or name */
  counterparty?: string;
  /** Optional transaction fee */
  fee?: string;
  /** Optional raw transaction hash */
  hash?: string;
  /** User-assignable category tag names */
  tags?: string[];
}

// Transaction component props
export interface TransactionsTableProps {
  transactions: TransactionProps[];
}

export interface TokenIconProps {
  token: string;
}

export interface TransactionsHeaderProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
}

export interface TransactionsFiltersProps {
  searchQuery: string;
  selectedFilter: string;
  sortConfigs: SortConfig[];
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onSort: (field: SortField, options?: { shiftKey?: boolean }) => void;
  /** Opens the advanced filter panel. */
  onAdvancedFilterToggle?: () => void;
  /** Optional debounce delay for search input */
  debounceMs?: number;
  /** Whether any advanced filters (amount range, counterparty) are active. */
  hasAdvancedFilters?: boolean;
  /** Currently selected tag filter (empty = all) */
  tagFilter?: string;
  /** All available tags for tag filtering */
  allTags?: Tag[];
  /** Called when tag filter changes */
  onTagFilterChange?: (tagName: string) => void;
}
