"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPaymentHistory, PaymentHistoryItem } from "@/lib/api";

interface UsePaymentHistoryResult {
  data: PaymentHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch payment history items for the dashboard sidebar.
 * Returns a stable refetch callback that clears stale errors before retrying.
 */
export function usePaymentHistory(): UsePaymentHistoryResult {
  const [data, setData] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const refetch = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    getPaymentHistory()
      .then((result) => {
        if (!cancelled && requestId === requestIdRef.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && requestId === requestIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load payment history"
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { data, isLoading, error, refetch };
}
