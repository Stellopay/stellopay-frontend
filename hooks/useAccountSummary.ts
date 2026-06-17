"use client";

import { useState, useEffect } from "react";
import { getAccountSummary, AccountSummary } from "@/lib/api";

interface UseAccountSummaryResult {
  data: AccountSummary | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch account summary data for the dashboard.
 */
export function useAccountSummary(): UseAccountSummaryResult {
  const [data, setData] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getAccountSummary()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load account summary"
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
