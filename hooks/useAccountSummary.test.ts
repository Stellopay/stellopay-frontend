import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAccountSummary } from "@/hooks/useAccountSummary";
import { getAccountSummary } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getAccountSummary: vi.fn(),
}));

const summary = {
  balance: "$ 2,432 USDC",
  balanceRaw: 2432,
  paidThisMonth: "$ 0",
  paidThisMonthCount: 0,
  toBePaid: "$ 0",
  toBePaidCount: 0,
  walletAddress: "GABC...F123",
};

describe("useAccountSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads account summary data", async () => {
    vi.mocked(getAccountSummary).mockResolvedValue(summary);

    const { result } = renderHook(() => useAccountSummary());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(summary);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("clears an error before refetching successfully", async () => {
    vi.mocked(getAccountSummary)
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce(summary);

    const { result } = renderHook(() => useAccountSummary());

    await waitFor(() =>
      expect(result.current.error).toBe("temporary failure"),
    );

    act(() => {
      result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.data).toEqual(summary));
    expect(result.current.error).toBeNull();
  });
});
