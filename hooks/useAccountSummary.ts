"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAccountSummary, AccountSummary } from "@/lib/api";

interface UseAccountSummaryResult {
  data: AccountSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch account summary data for the dashboard.
 * Returns a stable refetch callback that clears stale errors before retrying.
 */
export function useAccountSummary(): UseAccountSummaryResult {
  const [data, setData] = useState<AccountSummary | null>(null);
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

    getAccountSummary()
      .then((result) => {
        if (!cancelled && requestId === requestIdRef.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && requestId === requestIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load account summary"
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
