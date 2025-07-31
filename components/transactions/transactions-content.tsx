"use client";

import { useState, useMemo } from "react";
import type { SortField, TransactionFilters, Transaction, TransactionProps } from "@/types/transaction";
import { filterTransactions, sortTransactions } from "@/utils/transactionUtils";
import { transactions as allTransactions } from "@/public/data/mock-data";
import TransactionsHeader from "./transactions-header";
import TransactionsFilters from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";
import TransactionsPagination from "./transactions-pagination";
import { getPageItems, getTotalPages } from "@/utils/paginationUtils";

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

  // Helper function to convert TransactionProps to Transaction
  const convertToTransaction = (transaction: TransactionProps): Transaction => {
    // Extract numeric amount from string (remove +, -, $ symbols)
    const amountStr = transaction.amount.replace(/[+$]/g, '');
    const amount = parseFloat(amountStr);
    
    return {
      id: transaction.id,
      type: transaction.type,
      txId: transaction.id, // Use id as txId since TransactionProps doesn't have txId
      address: transaction.address,
      date: transaction.date,
      time: transaction.time,
      token: transaction.token,
      amount: amount,
      status: transaction.status,
      statusColor: transaction.status === "Completed" ? "success" : 
                   transaction.status === "Pending" ? "warning" : "destructive"
    };
  };

  // Helper function to transform Transaction to TransactionProps
  const transformTransaction = (transaction: Transaction): TransactionProps => ({
    id: transaction.id,
    type: transaction.type,
    address: transaction.address,
    date: transaction.date,
    time: transaction.time,
    token: transaction.token,
    amount: transaction.amount >= 0 ? `+$${transaction.amount.toFixed(2)}` : `-$${Math.abs(transaction.amount).toFixed(2)}`,
    status: transaction.status as "Completed" | "Pending" | "Failed",
    tokenIcon: getTokenIcon(transaction.token)
  });

  // Convert mock data to Transaction format for processing
  const convertedTransactions = useMemo(() => {
    return allTransactions.map(convertToTransaction);
  }, []);

  // Process transactions with filters and sorting
  const processedTransactions = useMemo(() => {
    const filtered = filterTransactions(
      convertedTransactions,
      filters.searchQuery,
      filters.selectedFilter,
      filters.fromDate,
      filters.toDate
    );

    const sorted = sortTransactions(filtered, filters.sortField, filters.sortDirection);
    
    // Transform back to TransactionProps format for display
    return sorted.map(transformTransaction);
  }, [convertedTransactions, filters]);

  // Get paginated transactions
  const paginatedTransactions = useMemo(() => {
    return getPageItems(processedTransactions, currentPage, itemsPerPage);
  }, [processedTransactions, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

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
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
            <TransactionsTable transactions={paginatedTransactions} />

            {/* Pagination */}
            <TransactionsPagination 
              totalItems={processedTransactions.length}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
