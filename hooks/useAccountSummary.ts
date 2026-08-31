"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAccountSummary, AccountSummary } from "@/lib/api";
import { useWallet } from "@/context/wallet-context";

interface UseAccountSummaryResult {
  data: AccountSummary | null;
  isLoading: boolean;
  error: string | null;
  isStale: boolean;
  refetch: () => void;
}

// Module-level cache scoped to the session, keyed by `${network.id}:${address}`
// to ensure proper scoping across accounts. Each entry records when it was
// fetched so callers can detect stale data after a long offline period.
const STALE_AFTER_MS = 60_000; // 1 minute

interface CacheEntry {
  value: AccountSummary;
  fetchedAt: number;
}

const accountSummaryCache = new Map<string, CacheEntry>();

function readCache(key: string | null): CacheEntry | null {
  return key ? accountSummaryCache.get(key) ?? null : null;
}

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
    return readCache(cacheKey)?.value ?? null;
  });

  const [isStale, setIsStale] = useState<boolean>(() => {
    const entry = readCache(cacheKey);
    return !!entry && Date.now() - entry.fetchedAt > STALE_AFTER_MS;
  });

  const [isLoading, setIsLoading] = useState(() => {
    return cacheKey ? !readCache(cacheKey) : false;
  });

  const [error, setError] = useState<string | null>(null);
  const [requestTick, setRequestTick] = useState(0);
  const latestRequestId = useRef(0);

  // Sync state with cache if cacheKey changes (e.g. account switch)
  const previousCacheKey = useRef(cacheKey);
  if (previousCacheKey.current !== cacheKey) {
    previousCacheKey.current = cacheKey;
    const cached = readCache(cacheKey);
    setData(cached?.value ?? null);
    setIsStale(!!cached && Date.now() - cached.fetchedAt > STALE_AFTER_MS);
    setIsLoading(!cached && !!cacheKey);
    setError(null);
    // Serving stale data for this account/network on a (re)mount should not look
    // current: refresh it once, but keep the stale value visible until it lands.
    if (cached && Date.now() - cached.fetchedAt > STALE_AFTER_MS) {
      setRequestTick((tick) => tick + 1);
    }
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

    if (!readCache(cacheKey)) {
      setIsLoading(true);
    }
    setError(null);

    getAccountSummary()
      .then((result) => {
        if (!cancelled && requestId === latestRequestId.current) {
          accountSummaryCache.set(cacheKey, { value: result, fetchedAt: Date.now() });
          setData(result);
          setIsStale(false);
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

  // Reconnect triggers exactly one controlled refresh so a long offline period
  // does not leave the dashboard showing a silently stale balance.
  useEffect(() => {
    const handleOnline = () => setRequestTick((tick) => tick + 1);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return { data, isLoading, error, isStale, refetch };
}
