import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi, type Mock } from "vitest";

import { useAccountSummary, clearAccountSummaryCache } from "./useAccountSummary";
import { getAccountSummary, type AccountSummary } from "@/lib/api";
import { useWallet } from "@/context/wallet-context";

vi.mock("@/lib/api", () => ({
  getAccountSummary: vi.fn(),
}));

vi.mock("@/context/wallet-context", () => ({
  useWallet: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const summary = (walletAddress: string): AccountSummary => ({
  balance: "$ 2,432 USDC",
  balanceRaw: 2432,
  paidThisMonth: "$ 0",
  paidThisMonthCount: 0,
  toBePaid: "$ 0",
  toBePaidCount: 0,
  walletAddress,
});

describe("useAccountSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAccountSummaryCache();
    (useWallet as Mock).mockReturnValue({
      address: "test-wallet-address",
      network: { id: "test-network" },
    });
  });

  it("exposes refetch and clears a stale error before retrying", async () => {
    (getAccountSummary as Mock)
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(summary("retry-wallet"));

    const { result } = renderHook(() => useAccountSummary());

    await waitFor(() => {
      expect(result.current.error).toBe("Network unavailable");
    });

    expect(typeof result.current.refetch).toBe("function");

    act(() => {
      result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data?.walletAddress).toBe("retry-wallet");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("keeps an older overlapping request from overwriting the latest refetch result", async () => {
    const first = deferred<AccountSummary>();
    const second = deferred<AccountSummary>();

    (getAccountSummary as Mock)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useAccountSummary());

    await waitFor(() => {
      expect(getAccountSummary).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(getAccountSummary).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      second.resolve(summary("latest-wallet"));
      await Promise.resolve();
    });

    expect(result.current.data?.walletAddress).toBe("latest-wallet");

    await act(async () => {
      first.resolve(summary("stale-wallet"));
      await Promise.resolve();
    });

    expect(result.current.data?.walletAddress).toBe("latest-wallet");
  });

  it("returns cached data synchronously on mount and triggers background refresh", async () => {
    // Fill the cache for the first request
    (getAccountSummary as Mock).mockResolvedValueOnce(summary("initial-wallet"));
    
    const { result, unmount } = renderHook(() => useAccountSummary());

    await waitFor(() => {
      expect(result.current.data?.walletAddress).toBe("initial-wallet");
    });

    // Unmount the first hook instance
    unmount();

    // Prepare a new mock response for the background refresh
    const backgroundRefresh = deferred<AccountSummary>();
    (getAccountSummary as Mock).mockReturnValueOnce(backgroundRefresh.promise);

    // Remount the hook
    const { result: remountedResult } = renderHook(() => useAccountSummary());

    // Should synchronously return cached data without loading state
    expect(remountedResult.current.data?.walletAddress).toBe("initial-wallet");
    expect(remountedResult.current.isLoading).toBe(false);

    // Background refresh should be triggered
    expect(getAccountSummary).toHaveBeenCalledTimes(2);

    // Resolve the background refresh with new data
    await act(async () => {
      backgroundRefresh.resolve(summary("refreshed-wallet"));
      await Promise.resolve();
    });

    // UI should seamlessly update to the refreshed data
    expect(remountedResult.current.data?.walletAddress).toBe("refreshed-wallet");
    expect(remountedResult.current.isLoading).toBe(false);
  });

  it("returns cold cache-miss path properly with loading state", async () => {
    // Start with a cleared cache
    const initialRequest = deferred<AccountSummary>();
    (getAccountSummary as Mock).mockReturnValueOnce(initialRequest.promise);

    const { result } = renderHook(() => useAccountSummary());

    // Should be in loading state initially
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);

    // Resolve the request
    await act(async () => {
      initialRequest.resolve(summary("cold-wallet"));
      await Promise.resolve();
    });

    // Loading should complete
    expect(result.current.data?.walletAddress).toBe("cold-wallet");
    expect(result.current.isLoading).toBe(false);
  });

  it("scopes cache correctly when account switches", async () => {
    (getAccountSummary as Mock).mockResolvedValueOnce(summary("account-1"));
    const { result, rerender } = renderHook(() => useAccountSummary());

    await waitFor(() => {
      expect(result.current.data?.walletAddress).toBe("account-1");
    });

    // Switch account
    (useWallet as Mock).mockReturnValue({
      address: "new-wallet-address",
      network: { id: "test-network" },
    });

    const account2Request = deferred<AccountSummary>();
    (getAccountSummary as Mock).mockReturnValueOnce(account2Request.promise);

    // Re-render the hook with the new context values
    rerender();

    // Should show loading state for the new account, and no data leak
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      account2Request.resolve(summary("account-2"));
      await Promise.resolve();
    });

    expect(result.current.data?.walletAddress).toBe("account-2");
  });
});
