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
  address: string;
  date: string;
  time: string;
  token: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed";
  tokenIcon: string;
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

/** A user-named preset that captures the full filter/sort state of the transactions view. */
export interface SavedView {
  id: string;
  name: string;
  filters: TransactionFilters;
  createdAt: string;
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
  /** Whether any advanced filters (amount range, counterparty) are active. */
  hasAdvancedFilters?: boolean;
  /** Saved views for the current account. */
  savedViews?: SavedView[];
  /** Callback to save the current filter/sort state as a named view. */
  onSaveView?: (name: string) => void;
  /** Callback to load (apply) a previously saved view. */
  onLoadView?: (view: SavedView) => void;
  /** Callback to rename a saved view. */
  onRenameView?: (view: SavedView, newName: string) => void;
  /** Callback to delete a saved view. */
  onDeleteView?: (view: SavedView) => void;
}
