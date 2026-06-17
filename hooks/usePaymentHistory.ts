"use client";

import { useState, useEffect } from "react";
import { getPaymentHistory, PaymentHistoryItem } from "@/lib/api";

interface UsePaymentHistoryResult {
  data: PaymentHistoryItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch payment history items for the dashboard sidebar.
 */
export function usePaymentHistory(): UsePaymentHistoryResult {
  const [data, setData] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getPaymentHistory()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load payment history"
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
