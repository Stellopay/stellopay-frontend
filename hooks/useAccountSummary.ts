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
 * Returns a stable `refetch` callback so error states can retry without remounting.
 */
export function useAccountSummary(): UseAccountSummaryResult {
  const [data, setData] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestTick, setRequestTick] = useState(0);
  const latestRequestId = useRef(0);

  const refetch = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setRequestTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    setIsLoading(true);
    setError(null);

    getAccountSummary()
      .then((result) => {
        if (!cancelled && requestId === latestRequestId.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && requestId === latestRequestId.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load account summary"
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestTick]);

  return { data, isLoading, error, refetch };
}
