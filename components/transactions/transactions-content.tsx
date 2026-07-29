"use client";

import { useState, useMemo, useCallback } from "react";
import { FileText } from "lucide-react";
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
import { TransactionsStatement } from "./transactions-statement";
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
  txId: t.txId,
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
  memo: t.memo,
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
  const [statementRange, setStatementRange] = useState<{
    fromDate: string;
    toDate: string;
  } | null>(null);
  const itemsPerPage = TRANSACTIONS_PAGE_SIZE;

  const { data, isLoading, error, refetch } = useTransactions({
    filters,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  // A statement needs the ledger before the selected range to calculate its
  // opening balance. Keep this request independent of table search/filter UI.
  // The API currently caps a response at 100 records; production APIs should
  // expose a server-side statement endpoint for ledgers larger than that.
  const statementLedger = useTransactions({
    filters: {
      fromDate: "",
      toDate: "",
      searchQuery: "",
      filterQuery: "",
      selectedFilter: "All Transactions",
      sortConfigs: [{ field: "date", direction: "asc" }],
    },
    page: 1,
    pageSize: 100,
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

        <div className="mb-4 flex justify-end px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              setStatementRange({ fromDate: filters.fromDate, toDate: filters.toDate })
            }
            disabled={statementLedger.isLoading || !!statementLedger.error}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            aria-describedby="statement-help"
          >
            <FileText aria-hidden="true" size={16} />
            Generate statement
          </button>
          <span id="statement-help" className="sr-only">
            Creates a printable reconciliation statement for the selected date range.
          </span>
          {statementLedger.error && (
            <p role="status" className="ml-3 self-center text-sm text-red-300">
              Statement data could not be loaded. Try again later.
            </p>
          )}
        </div>

        {statementRange && (
          <TransactionsStatement
            fromDate={statementRange.fromDate}
            toDate={statementRange.toDate}
            ledger={statementLedger.data?.data ?? []}
            onClose={() => setStatementRange(null)}
          />
        )}

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
