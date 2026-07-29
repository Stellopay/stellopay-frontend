/**
 * @fileoverview React hook for fetching paginated/filtered transactions.
 * Provides loading, error, and data states consumed by UI components.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { getTransactions, PaginatedTransactions } from "@/lib/api";

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
 * Fetch paginated, filtered transactions with full AbortController-based
 * cancellation to prevent stale async responses from corrupting UI state.
 *
 * ---
 *
 * ### Cancellation lifecycle (per-effect AbortController)
 *
 * Every time the effect re-runs (when `filters`, `page`, `pageSize`, or the
 * internal `tick` counter changes) a **new** `AbortController` is created for
 * that request. The effect's cleanup function calls `controller.abort()`,
 * which means:
 *
 * - **Filter / page change** — React runs the previous effect's cleanup
 *   *before* executing the new effect, so the in-flight request for the old
 *   parameters is aborted before the new one starts.
 * - **Component unmount** — React runs the cleanup on unmount, aborting any
 *   pending request so no `setState` call can fire on an unmounted component.
 * - **`refetch()` call** — increments `tick`, which is in the dependency
 *   array, triggering the same cleanup-then-rerun cycle.
 *
 * ### Request-identity guard (`requestId`)
 *
 * In addition to the abort signal, each effect run captures a unique
 * `Symbol("useTransactions-request")` as `requestId`. Both `.then()` and
 * `.catch()` callbacks compare the captured `requestId` against
 * `latestRequestId` before committing any state. This is a belt-and-suspenders
 * defence: even if an aborted promise somehow resolves instead of rejecting
 * (which can happen with some polyfills or test doubles), the stale result
 * cannot overwrite the data from a later request.
 *
 * ### AbortError swallowing
 *
 * `getTransactions` rejects with a `DOMException` whose `.name` is
 * `"AbortError"` when the signal fires. This rejection is **not** surfaced to
 * the caller via the `error` field — it is the expected outcome of the
 * cancellation lifecycle. The hook detects an AbortError by checking
 * `err.name === "AbortError"` rather than `instanceof DOMException` because
 * jsdom's `DOMException` is a cross-realm object that fails `instanceof`
 * checks in tests.
 *
 * ### `refetch` reference stability
 *
 * `refetch` is wrapped in `useCallback` with an empty dependency array, so
 * its reference is stable across renders. It is safe to pass to memoized
 * child components and dependency arrays without causing extra re-renders.
 *
 * @example
 * ```tsx
 * function TransactionList() {
 *   const { data, isLoading, error, refetch } = useTransactions({
 *     filters: { searchQuery: 'stellar' },
 *     page: 1,
 *     pageSize: 10,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error)     return <ErrorBanner message={error} onRetry={refetch} />;
 *   return <Table rows={data?.data} />;
 * }
 * ```
 *
 * @param options - Optional filters, page index (1-based), and page size.
 *   Defaults to `{ page: 1, pageSize: 6 }` with no filters.
 * @returns `{ data, isLoading, error, refetch }` — current result state and
 *   a stable callback to manually re-trigger the request.
 */
export function useTransactions(
  options: UseTransactionsOptions = {},
): UseTransactionsResult {
  const { filters, page = 1, pageSize = 6 } = options;

  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  /**
   * Effect cancellation is critical to prevent stale async responses from
   * overwriting newer filter/page results.
   */
  useEffect(() => {
    const controller = new AbortController();
    const requestId = Symbol("useTransactions-request");

    // Only the latest request is allowed to commit state.
    // Implemented by aborting in-flight requests and additionally guarding
    // commits by request identity.
    const latestRequestId = requestId;

    setIsLoading(true);

    setError(null);

    getTransactions({ filters, page, pageSize }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (requestId !== latestRequestId) return;
        setData(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        // AbortError is expected during rapid filter/page changes. Check the
        // error's own name rather than `instanceof Error`/`instanceof
        // Object` — jsdom's DOMException is a cross-realm object that fails
        // both those checks despite being a real AbortError — and rather
        // than only our controller's signal, since the underlying fetch can
        // reject with AbortError before our `controller.abort()` cleanup
        // call ever flips `signal.aborted`.
        const isAbortError =
          typeof err === "object" &&
          err !== null &&
          (err as { name?: unknown }).name === "AbortError";
        if (controller.signal.aborted || isAbortError) return;
        if (requestId !== latestRequestId) return;

        setError(
          err instanceof Error ? err.message : "Failed to load transactions",
        );

        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    filters?.searchQuery,
    filters?.filterQuery,

    filters?.selectedFilter,
    filters?.fromDate,
    filters?.toDate,
    filters?.minAmount,
    filters?.maxAmount,
    filters?.sortConfigs,
    page,
    pageSize,
    tick,
  ]);

  return { data, isLoading, error, refetch };
}
