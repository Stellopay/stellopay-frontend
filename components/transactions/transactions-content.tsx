"use client";

import { useState, useMemo, useCallback } from "react";
import type { SortField, TransactionFilters, Transaction, TransactionProps } from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import TransactionsHeader from "./transactions-header";
import TransactionsFilters from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";
import TransactionsPagination from "./transactions-pagination";

/** Map token symbol → icon path */
const getTokenIcon = (token: string): string => {
  switch (token) {
    case "USDC": return "/usdc-logo.png";
    case "XLM":  return "/stellar-xlm-logo.png";
    default:     return "/usd.png";
  }
};

/** Convert internal Transaction → display TransactionProps */
const toTransactionProps = (t: Transaction): TransactionProps => ({
  id: t.id,
  type: t.type,
  address: t.address,
  date: t.date,
  time: t.time,
  token: t.token,
  amount:
    t.amount >= 0
      ? `+$${t.amount.toFixed(2)}`
      : `-$${Math.abs(t.amount).toFixed(2)}`,
  status: t.status as "Completed" | "Pending" | "Failed",
  tokenIcon: getTokenIcon(t.token),
});

export default function TransactionsContent() {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchQuery: "",
    fromDate: "2023-03-26",
    toDate: "2023-04-15",
    selectedFilter: "All Transactions",
    sortField: "date",
    sortDirection: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data, isLoading, error } = useTransactions({
    filters,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const paginatedTransactions: TransactionProps[] = useMemo(
    () => (data?.data ?? []).map(toTransactionProps),
    [data]
  );

  const updateFilter = useCallback(
    <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    []
  );

  const handleSort = useCallback((field: SortField) => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortDirection:
        prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  return (
    <div className="min-h-screen text-white mt-4">
      <div className="w-full max-w-7xl mx-auto mb-4">
        <TransactionsHeader
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onFromDateChange={(date) => updateFilter("fromDate", date)}
          onToDateChange={(date) => updateFilter("toDate", date)}
        />

        <div className="px-4 sm:px-6 lg:px-8 bg-[#160f17] pt-3 border-[#2D2D2D] border rounded-xl">
          <TransactionsFilters
            searchQuery={filters.searchQuery}
            selectedFilter={filters.selectedFilter}
            sortField={filters.sortField}
            sortDirection={filters.sortDirection}
            onSearchChange={(q) => updateFilter("searchQuery", q)}
            onFilterChange={(f) => updateFilter("selectedFilter", f)}
            onSort={handleSort}
          />

          <div className="py-4">
            {/* Loading state */}
            {isLoading && <TransactionTableSkeleton rows={itemsPerPage} />}

            {/* Error state */}
            {!isLoading && error && (
              <div
                role="alert"
                className="py-8 text-center text-red-400 text-sm"
              >
                Failed to load transactions. Please try again.
              </div>
            )}

            {/* Data state */}
            {!isLoading && !error && (
              <>
                <TransactionsTable transactions={paginatedTransactions} />
                <TransactionsPagination
                  totalItems={data?.total ?? 0}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
