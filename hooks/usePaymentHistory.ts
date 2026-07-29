"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPaymentHistory, PaymentHistoryItem } from "@/lib/api";

interface UsePaymentHistoryResult {
  data: PaymentHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

export function usePaymentHistory(): UsePaymentHistoryResult {
  const [data, setData] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestTick, setRequestTick] = useState(0);
  const latestRequestId = useRef(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;
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

    getPaymentHistory()
      .then((result) => {
        if (!cancelled && requestId === latestRequestId.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && requestId === latestRequestId.current) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load payment history",
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [requestTick]);

  return { data, isLoading, error, refetch };
}
