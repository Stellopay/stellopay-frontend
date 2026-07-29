"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAccountSummary, AccountSummary } from "@/lib/api";
import { useWallet } from "@/context/wallet-context";

interface UseAccountSummaryResult {
  data: AccountSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Module-level cache scoped to the session.
// Keyed by `${network.id}:${address}` to ensure proper scoping across accounts.
const accountSummaryCache = new Map<string, AccountSummary>();

export function clearAccountSummaryCache() {
  accountSummaryCache.clear();
}

/**
 * Hook to fetch account summary data for the dashboard.
 * Returns a stable `refetch` callback so error states can retry without remounting.
 */
export function useAccountSummary(): UseAccountSummaryResult {
  const { address, network } = useWallet();
  const cacheKey = address ? `${network.id}:${address}` : null;

  const [data, setData] = useState<AccountSummary | null>(() => {
    return cacheKey ? accountSummaryCache.get(cacheKey) || null : null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    return cacheKey ? !accountSummaryCache.has(cacheKey) : false;
  });

  const [error, setError] = useState<string | null>(null);
  const [requestTick, setRequestTick] = useState(0);
  const latestRequestId = useRef(0);

  // Sync state with cache if cacheKey changes (e.g. account switch)
  const previousCacheKey = useRef(cacheKey);
  if (previousCacheKey.current !== cacheKey) {
    previousCacheKey.current = cacheKey;
    const cached = cacheKey ? accountSummaryCache.get(cacheKey) || null : null;
    setData(cached);
    setIsLoading(!cached && !!cacheKey);
    setError(null);
  }

  const refetch = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setRequestTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (!cacheKey) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    if (!accountSummaryCache.has(cacheKey)) {
      setIsLoading(true);
    }
    setError(null);

    getAccountSummary()
      .then((result) => {
        if (!cancelled && requestId === latestRequestId.current) {
          accountSummaryCache.set(cacheKey, result);
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && requestId === latestRequestId.current) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load account summary",
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, requestTick]);

  return { data, isLoading, error, refetch };
}
