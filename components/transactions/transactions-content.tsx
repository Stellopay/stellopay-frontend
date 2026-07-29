"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  SortField,
  SortConfig,
  TransactionFilters,
  Transaction,
  TransactionProps,
} from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import TransactionsHeader from "./transactions-header";
import TransactionsFilters from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";
import TransactionsPagination from "./transactions-pagination";
import { ErrorState } from "@/components/ui/error-state";
import {
  TRANSACTIONS_PAGE_SIZE,
  getDefaultDateRange,
} from "./transactions-config";

/** Map token symbol → icon path */
const getTokenIcon = (token: string): string => {
  switch (token) {
    case "USDC":
      return "/usdc-logo.png";
    case "XLM":
      return "/stellar-xlm-logo.png";
    default:
      return "/usd.png";
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
  const [filters, setFilters] = useState<TransactionFilters>(() => ({
    searchQuery: "",
    filterQuery: "",
    ...getDefaultDateRange(),
    selectedFilter: "All Transactions",
    sortConfigs: [{ field: "date", direction: "desc" }],
  }));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = TRANSACTIONS_PAGE_SIZE;

  const { data, isLoading, error, refetch } = useTransactions({
    filters,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const paginatedTransactions: TransactionProps[] = useMemo(
    () => (data?.data ?? []).map(toTransactionProps),
    [data],
  );

  const updateFilter = useCallback(
    <K extends keyof TransactionFilters>(
      key: K,
      value: TransactionFilters[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    [],
  );

  const handleSort = useCallback(
    (field: SortField, options?: { shiftKey?: boolean }) => {
      setFilters((prev) => {
        const currentConfigs = prev.sortConfigs;
        const primary = currentConfigs[0];

        // Shift-click: add/modify secondary sort
        if (options?.shiftKey && primary && primary.field !== field) {
          const secondary = currentConfigs[1];
          // If this field is already the secondary sort, toggle direction
          if (secondary?.field === field) {
            const newConfigs: SortConfig[] = [
              { field: primary.field, direction: primary.direction },
              {
                field,
                direction:
                  secondary.direction === "asc" ? "desc" : "asc",
              },
            ];
            return { ...prev, sortConfigs: newConfigs };
          }
          // Otherwise set it as secondary with 'asc' default
          const newConfigs: SortConfig[] = [
            { field: primary.field, direction: primary.direction },
            { field, direction: "asc" },
          ];
          return { ...prev, sortConfigs: newConfigs };
        }

        // Click without shift: set as primary sort,
        // toggling direction if it's already the primary field
        const isSameField = primary?.field === field;
        const newDirection =
          isSameField && primary?.direction === "asc" ? "desc" : "asc";
        return {
          ...prev,
          sortConfigs: [{ field, direction: newDirection }],
        };
      });
      setCurrentPage(1);
    },
    [],
  );

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
            sortConfigs={filters.sortConfigs}
            onSearchChange={(q) => updateFilter("searchQuery", q)}
            onFilterChange={(f) => updateFilter("selectedFilter", f)}
            onSort={handleSort}
          />

          <div className="py-4">
            {/* Loading state */}
            {isLoading && <TransactionTableSkeleton rows={itemsPerPage} />}

            {/* Error state */}
            {!isLoading && error && (
              <ErrorState
                title="Failed to Load"
                description={error}
                onRetry={refetch}
              />
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
