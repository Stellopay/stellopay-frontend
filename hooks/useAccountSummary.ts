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
 * Fetches the dashboard account summary for the currently connected wallet.
 *
 * The hook reads the wallet address and network from {@link useWallet} and
 * returns a standard `{ data, isLoading, error, refetch }` shape.  Results
 * are cached in a module-level Map keyed by `${network.id}:${address}` so
 * navigating away and back rehydrates from the cache without a loading flash.
 *
 * The `refetch` callback is stable across renders, clears any previous
 * error, and forces a new fetch even when cached data exists.  It is safe to
 * pass directly to an `<ErrorState onRetry={refetch} />` without wrapping.
 *
 * @returns An object with the following fields:
 *
 * - `data`     — `AccountSummary | null`  The latest account summary, or `null`
 *                before the first successful fetch.
 * - `isLoading`— `boolean`  `true` while the initial or refetch request is in
 *                flight; `false` when a cached result is served synchronously.
 * - `error`    — `string | null`  A human-readable error message when the most
 *                recent fetch fails, or `null` on success.
 * - `refetch`  — `() => void`  Stable function that resets `error`, sets
 *                `isLoading = true`, and re-fetches from the API.
 *
 * @example
 * ```tsx
 * import { useAccountSummary } from "@/hooks/useAccountSummary";
 * import { ErrorState } from "@/components/ui/error-state";
 *
 * function DashboardSummary() {
 *   const { data, isLoading, error, refetch } = useAccountSummary();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return (
 *     <ErrorState
 *       title="Failed to Load"
 *       description={error}
 *       onRetry={refetch}
 *     />
 *   );
 *
 *   return <p>Balance: {data?.balance}</p>;
 * }
 * ```
 *
 * @see {@link usePaymentHistory} — the payment-history hook that shares the
 *      same `{ data, isLoading, error, refetch }` contract.
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
