"use client";

import { useState, useMemo } from "react";
import type { SortField, TransactionFilters } from "@/types/transaction";
import { filterTransactions, sortTransactions } from "@/utils/transactionUtils";
import { allTransactions } from "@/lib/transactions";
import TransactionsHeader from "./transactions-header";
import TransactionsFilters from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";
import TransactionsPagination from "./transactions-pagination";

export default function TransactionsContent() {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchQuery: "",
    fromDate: "2023-03-26",
    toDate: "2023-04-15",
    selectedFilter: "All Transactions",
    sortField: "date",
    sortDirection: "desc",
  });

  // Helper function to get token icon based on token type
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

  // Helper function to transform Transaction to TransactionProps
  const transformTransaction = (transaction: any): any => ({
    ...transaction,
    amount: transaction.amount >= 0 ? `+$${transaction.amount.toFixed(2)}` : `-$${Math.abs(transaction.amount).toFixed(2)}`,
    tokenIcon: getTokenIcon(transaction.token),
    status: transaction.status as "Completed" | "Pending" | "Failed"
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

    const sorted = sortTransactions(filtered, filters.sortField, filters.sortDirection);
    
    // Transform to TransactionProps format
    return sorted.map(transformTransaction);
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
