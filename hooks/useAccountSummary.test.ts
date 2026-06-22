import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi, type Mock } from "vitest";

import { useAccountSummary } from "./useAccountSummary";
import { getAccountSummary, type AccountSummary } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getAccountSummary: vi.fn(),
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
});
