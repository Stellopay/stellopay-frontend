"use client";

import React, { useState, useEffect, useMemo } from "react";
import TransactionHeader from "@/components/dashboard/transaction-header";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import TransactionsPagination from "@/components/transactions/transactions-pagination";
import TableSearchbar from "@/components/transactions/table-searchbar";
import Filter from "@/components/transactions/filter";
import Sort from "@/components/transactions/sort";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import type { TransactionProps } from "@/types/transaction";
import { isDateInRange } from "@/utils/date-utils";

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

const Transactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState("");
  const [filterParams, setFilterParams] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const itemsPerPage = 6;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams, filterParams, startDate, endDate]);

  const { data, isLoading, error } = useTransactions({
    filters: { searchQuery: searchParams, filterQuery: filterParams },
    page: 1,
    pageSize: 1000, // fetch all so we can client-side date filter (same as original)
  });

  const allTransactions: TransactionProps[] = useMemo(() => {
    return (data?.data ?? []).map((t) => ({
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
    }));
  }, [data]);

  const dateFiltered = useMemo(
    () =>
      allTransactions.filter((t) => isDateInRange(t.date, startDate, endDate)),
    [allTransactions, startDate, endDate],
  );

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return dateFiltered.slice(start, start + itemsPerPage);
  }, [dateFiltered, currentPage]);

  return (
    <div>
      <TransactionHeader
        pageTitle="Transaction"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <div className="container mx-auto py-8 px-8">
        <div className="bg-foreground border rounded-[1.5rem] border-[#2D2D2D] p-2">
          <div className="grid items-center justify-between pb-2 md:pb-0 md:flex">
            <h1 className="flex items-center gap-1 p-2 mb-4 text-xl font-medium">
              <div
                className="bg-[#121212] rounded-lg border border-[#2E2E2E] p-1"
                aria-hidden="true"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M18.9999 10.5V9.99995C18.9999 6.22876 18.9998 4.34311 17.8283 3.17154C16.6567 2 14.7711 2 10.9999 2C7.22883 2 5.3432 2.00006 4.17163 3.17159C3.00009 4.34315 3.00007 6.22872 3.00004 9.99988L3 14.5C2.99997 17.7874 2.99996 19.4312 3.90788 20.5375C4.07412 20.7401 4.25986 20.9258 4.46243 21.0921C5.56877 22 7.21249 22 10.4999 22"
                    stroke="#E5E5E5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 7H15M7 11H11"
                    stroke="#E5E5E5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 18.5L16.5 17.95V15.5M12 17.5C12 19.9853 14.0147 22 16.5 22C18.9853 22 21 19.9853 21 17.5C21 15.0147 18.9853 13 16.5 13C14.0147 13 12 15.0147 12 17.5Z"
                    stroke="#E5E5E5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>All Transactions</span>
              {(startDate || endDate) && (
                <span className="text-sm text-[#9CA3AF]">
                  ({dateFiltered.length} filtered)
                </span>
              )}
            </h1>

            <div className="flex items-center gap-2">
              <TableSearchbar onSearch={setSearchParams} />
              <Filter value={filterParams} onChange={setFilterParams} />
              <Sort />
            </div>
          </div>

          {/* Loading state */}
          {isLoading && <TransactionTableSkeleton rows={itemsPerPage} />}

          {/* Error state */}
          {!isLoading && error && (
            <div role="alert" className="py-8 text-center text-red-400 text-sm">
              Failed to load transactions. Please try again.
            </div>
          )}

          {/* Data state */}
          {!isLoading && !error && (
            <>
              <TransactionsTable transactions={paginated} />
              {(searchParams || filterParams || startDate || endDate) &&
                paginated.length === 0 && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="py-4 text-center text-gray-400"
                  >
                    No Transactions Found
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {!isLoading && !error && dateFiltered.length > 0 && (
        <TransactionsPagination
          totalItems={dateFiltered.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default Transactions;
