import { useState, useCallback, useEffect, useRef } from "react";

export type WidgetStateStatus = "idle" | "loading" | "success" | "error" | "stale";

export interface WidgetState<T> {
  status: WidgetStateStatus;
  data: T | null;
  error: string | null;
  lastUpdated: number | null;
  retryCount: number;
}

export interface UseWidgetStateOptions<T> {
  /** Initial data to show while loading (stale data) */
  initialData?: T | null;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** Time in milliseconds before data is considered stale */
  staleTime?: number;
  /** Whether to automatically refetch on mount */
  enabled?: boolean;
  /** Widget ID for accessibility announcements */
  widgetId?: string;
}

export interface UseWidgetStateReturn<T> {
  state: WidgetState<T>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isStale: boolean;
  data: T | null;
  error: string | null;
  retryCount: number;
  refetch: () => Promise<T | null | void>;
  retry: () => void;
  reset: () => void;
  setData: (data: T) => void;
  setError: (message: string) => void;
  setLoading: () => void;
  setStale: () => void;
}

/**
 * Custom hook for managing independent widget state with retry and stale-data behavior.
 * 
 * Features:
 * - Independent state per widget (loading/error/success/stale)
 * - Retry logic with configurable attempts and delay
 * - Stale data handling with configurable time threshold
 * - Screen reader accessibility announcements
 * - Automatic refetch on mount (configurable)
 * 
 * @example
 * ```tsx
 * const { state, isLoading, isError, data, refetch, retry } = useWidgetState({
 *   initialData: cachedData,
 *   maxRetries: 3,
 *   retryDelay: 1000,
 *   staleTime: 30000,
 *   widgetId: 'account-overview'
 * });
 * 
 * useEffect(() => {
 *   const fetchData = async () => {
 *     try {
 *       const result = await fetchWidgetData();
 *       setData(result);
 *     } catch (err) {
 *       // Error is handled by the hook
 *     }
 *   };
 *   fetchData();
 * }, []);
 * ```
 */
export function useWidgetState<T = unknown>(
  options: UseWidgetStateOptions<T> = {}
): UseWidgetStateReturn<T> {
  const {
    initialData = null,
    maxRetries = 3,
    retryDelay = 1000,
    staleTime = 30000,
    enabled = true,
    widgetId = "widget",
  } = options;

  const [state, setState] = useState<WidgetState<T>>({
    status: initialData ? "stale" : "idle",
    data: initialData,
    error: null,
    lastUpdated: initialData ? Date.now() : null,
    retryCount: 0,
  });

  const retryTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const fetcherRef = useRef<(() => Promise<T> | T) | null>(null);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Check if data is stale
  const checkStale = useCallback(() => {
    if (!state.lastUpdated) return false;
    return Date.now() - state.lastUpdated > staleTime;
  }, [state.lastUpdated, staleTime]);

  // Announce state changes to screen readers
  const announceStateChange = useCallback((
    status: WidgetStateStatus,
    message: string
  ) => {
    if (typeof window === "undefined") return;
    
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = `${widgetId}: ${message}`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [widgetId]);

  const setData = useCallback((data: T) => {
    if (!isMountedRef.current) return;
    
    setState({
      status: "success",
      data,
      error: null,
      lastUpdated: Date.now(),
      retryCount: 0,
    });
    
    announceStateChange("success", "Data loaded successfully");
  }, [announceStateChange]);

  const setError = useCallback((error: string) => {
    if (!isMountedRef.current) return;
    
    setState((prev) => ({
      ...prev,
      status: "error",
      error,
      data: prev.data, // Keep stale data on error
    }));
    
    announceStateChange("error", "Failed to load data");
  }, [announceStateChange]);

  const setLoading = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setState((prev) => ({
      ...prev,
      status: "loading",
      error: null,
    }));
    
    announceStateChange("loading", "Loading data");
  }, [announceStateChange]);

  const setStale = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setState((prev) => ({
      ...prev,
      status: "stale",
    }));
  }, []);

  const execute = useCallback(async (runner: () => Promise<T> | T) => {
    if (!isMountedRef.current) return null;

    fetcherRef.current = runner;
    setLoading();

    try {
      const result = await Promise.resolve(runner());
      setData(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load data";
      setError(message);
      return null;
    }
  }, [setData, setError, setLoading]);

  const refetch = useCallback(async () => {
    if (!isMountedRef.current) return null;

    if (fetcherRef.current) {
      return execute(fetcherRef.current);
    }

    setLoading();
    return state.data;
  }, [execute, setLoading, state.data]);

  const retry = useCallback(() => {
    if (!isMountedRef.current) return;

    const nextRetryCount = Math.min(state.retryCount + 1, maxRetries);
    const canRetry = state.retryCount < maxRetries;

    setState((prev) => {
      if (prev.retryCount >= maxRetries) {
        return prev;
      }

      return {
        ...prev,
        status: "loading",
        error: null,
        retryCount: prev.retryCount + 1,
      };
    });

    if (!canRetry) {
      announceStateChange("error", "Retry limit reached");
      return;
    }

    announceStateChange("loading", `Retrying (attempt ${nextRetryCount})`);

    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      void refetch();
    }, retryDelay);
  }, [announceStateChange, maxRetries, refetch, retryDelay, state.retryCount]);

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;

    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    fetcherRef.current = null;

    setState({
      status: initialData ? "stale" : "idle",
      data: initialData,
      error: null,
      lastUpdated: initialData ? Date.now() : null,
      retryCount: 0,
    });
  }, [initialData]);

  // Check for stale data periodically
  useEffect(() => {
    if (!enabled || state.status !== "success" || !state.lastUpdated) return;
    
    const interval = setInterval(() => {
      if (checkStale() && isMountedRef.current) {
        setStale();
        announceStateChange("stale", "Data may be outdated");
      }
    }, staleTime / 2); // Check at half the stale time interval
    
    return () => clearInterval(interval);
  }, [enabled, state.status, state.lastUpdated, staleTime, checkStale, setStale, announceStateChange]);

  return {
    state,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    isStale: state.status === "stale",
    data: state.data,
    error: state.error,
    retryCount: state.retryCount,
    refetch,
    retry,
    reset,
    setData,
    setError,
    setLoading,
    setStale,
  };
}
