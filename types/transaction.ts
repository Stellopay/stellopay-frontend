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
  /** Ordered list of sort criteria. The first entry is the primary sort,
   *  the second (if present) is the secondary (tiebreaker) sort, etc. */
  sortConfigs: SortConfig[];
  /** Minimum transaction amount filter (absolute value). */
  minAmount?: number;
  /** Maximum transaction amount filter (absolute value). */
  maxAmount?: number;
  /** Counterparty address filter (partial match). */
  counterparty?: string;
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
  memo?: string;
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
}
