"use client";

import { useState, useMemo } from "react";
import type { SortField, TransactionFilters } from "@/types/transaction";
import { filterTransactions, sortTransactions } from "@/utils/transactionUtils";
import { allTransactions } from "@/lib/transactions";
import TransactionsHeader from "./TransactionsHeader";
import TransactionsFilters from "./TransactionsFilters";
import TransactionsTable from "./TransactionsTable";
import TransactionsPagination from "./TransactionsPagination";

export default function TransactionsContent() {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchQuery: "",
    fromDate: "2023-03-26",
    toDate: "2023-04-15",
    selectedFilter: "All Transactions",
    sortField: "date",
    sortDirection: "desc",
  });

  // Process transactions with filters and sorting
  const processedTransactions = useMemo(() => {
    const filtered = filterTransactions(
      allTransactions,
      filters.searchQuery,
      filters.selectedFilter,
      filters.fromDate,
      filters.toDate
    );

    return sortTransactions(filtered, filters.sortField, filters.sortDirection);
  }, [filters]);

  // Handler functions
  const handleSort = (field: SortField) => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortDirection:
        prev.sortField === field && prev.sortDirection === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen  text-white mt-4">
      {/* Container with responsive padding and max-width */}
      <div className="w-full max-w-7xl mx-auto   mb-4">
        {/* Header Section */}
        <TransactionsHeader
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onFromDateChange={(date) => updateFilter("fromDate", date)}
          onToDateChange={(date) => updateFilter("toDate", date)}
        />
        <div className="px-4 sm:px-6 lg:px-8 bg-[#160f17] pt-3 border-[#2D2D2D] border rounded-xl">
          {/* Filters Section */}
          <TransactionsFilters
            searchQuery={filters.searchQuery}
            selectedFilter={filters.selectedFilter}
            sortField={filters.sortField}
            sortDirection={filters.sortDirection}
            onSearchChange={(query) => updateFilter("searchQuery", query)}
            onFilterChange={(filter) => updateFilter("selectedFilter", filter)}
            onSort={handleSort}
          />

          {/* Content Section */}
          <div className="py-4">
            {/* Table */}
            <TransactionsTable transactions={processedTransactions} />

            {/* Pagination */}
            <TransactionsPagination totalItems={processedTransactions.length} />
          </div>
        </div>
      </div>
    </div>
  );
}
