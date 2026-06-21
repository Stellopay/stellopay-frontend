/**
 * @fileoverview React hook for fetching paginated/filtered transactions.
 * Provides loading, error, and data states consumed by UI components.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getTransactions, PaginatedTransactions } from "@/lib/api";

import type { TransactionFilters } from "@/types/transaction";

interface UseTransactionsOptions {
  filters?: Partial<TransactionFilters>;

  page?: number;
  pageSize?: number;
}

interface UseTransactionsResult {
  data: PaginatedTransactions | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch transactions with filters, pagination, and loading/error states.
 *
 * @param options - filters, page, and pageSize
 */
export function useTransactions(
  options: UseTransactionsOptions = {}
): UseTransactionsResult {
  const { filters, page = 1, pageSize = 6 } = options;

  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  /**
   * Memo key: the scalar filter fields, page, and page size are the complete
   * query identity. This prevents equivalent caller object literals from
   * forcing a new transaction derivation.
   */
  const query = useMemo(
    () => ({
      filters: {
        searchQuery: filters?.searchQuery,
        selectedFilter: filters?.selectedFilter,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
        sortField: filters?.sortField,
        sortDirection: filters?.sortDirection,
      },
      page,
      pageSize,
    }),
    [
      filters?.searchQuery,
      filters?.selectedFilter,
      filters?.fromDate,
      filters?.toDate,
      filters?.sortField,
      filters?.sortDirection,
      page,
      pageSize,
    ],
  );

  /**
   * Effect cancellation is critical to prevent stale async responses from
   * overwriting newer filter/page results.
   */
  useEffect(() => {
    const controller = new AbortController();
    const requestId = Symbol("useTransactions-request");

    // Only the latest request is allowed to commit state.
    // Implemented by aborting in-flight requests and additionally guarding
    // commits by request identity.
    const latestRequestId = requestId;


    setIsLoading(true);

    setError(null);

    getTransactions(query, controller.signal)

      .then((result) => {
        if (controller.signal.aborted) return;
        if (requestId !== latestRequestId) return;
        setData(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        // AbortError is expected during rapid filter/page changes.
        if (controller.signal.aborted) return;
        if (requestId !== latestRequestId) return;

        setError(
          err instanceof Error ? err.message : "Failed to load transactions"
        );

        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    query,
    tick,
  ]);

  return { data, isLoading, error, refetch };
}
