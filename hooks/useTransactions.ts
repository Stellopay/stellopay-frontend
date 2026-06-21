/**
 * @fileoverview React hook for fetching paginated/filtered transactions.
 * Provides loading, error, and data states consumed by UI components.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { getTransactions, PaginatedTransactions } from "@/lib/api";
import { TRANSACTIONS_PAGE_SIZE } from "@/lib/transactionDefaults";
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
  options: UseTransactionsOptions = {},
): UseTransactionsResult {
  const { filters, page = 1, pageSize = TRANSACTIONS_PAGE_SIZE } = options;

  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getTransactions({ filters, page, pageSize })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load transactions",
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters?.searchQuery,
    filters?.selectedFilter,
    filters?.fromDate,
    filters?.toDate,
    filters?.sortField,
    filters?.sortDirection,
    page,
    pageSize,
    tick,
  ]);

  return { data, isLoading, error, refetch };
}
