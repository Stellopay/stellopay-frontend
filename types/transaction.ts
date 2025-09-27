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

export type SortField = "date" | "amount" | "type" | "status";
export type SortDirection = "asc" | "desc";

export interface TransactionFilters {
  searchQuery: string;
  fromDate: string;
  toDate: string;
  selectedFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
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

export interface TransactionsFiltersProps {
  searchQuery: string;
  selectedFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onSort: (field: SortField) => void;
}
