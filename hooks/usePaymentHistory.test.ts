import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePaymentHistory } from "@/hooks/usePaymentHistory";
import { getPaymentHistory } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getPaymentHistory: vi.fn(),
}));

const paymentHistory = [
  {
    id: "ph-1",
    paymentDescription: "Payment Sent",
    paymentId: "#TXN12345",
    history: "Your payment of 250 XLM",
  },
];

describe("usePaymentHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads payment history data", async () => {
    vi.mocked(getPaymentHistory).mockResolvedValue(paymentHistory);

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(paymentHistory);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("clears an error before refetching successfully", async () => {
    vi.mocked(getPaymentHistory)
      .mockRejectedValueOnce(new Error("history failed"))
      .mockResolvedValueOnce(paymentHistory);

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => expect(result.current.error).toBe("history failed"));

    act(() => {
      result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.data).toEqual(paymentHistory));
    expect(result.current.error).toBeNull();
  });
});
