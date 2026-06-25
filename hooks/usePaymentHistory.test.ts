import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi, type Mock } from "vitest";

import { usePaymentHistory } from "./usePaymentHistory";
import { getPaymentHistory, type PaymentHistoryItem } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getPaymentHistory: vi.fn(),
}));

const historyItems: PaymentHistoryItem[] = [
  {
    id: "payment-1",
    paymentDescription: "Payment Received",
    paymentId: "#PAY-1",
    history: "Received 42 USDC",
  },
];

describe("usePaymentHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes refetch and recovers from an error without remounting", async () => {
    (getPaymentHistory as Mock)
      .mockRejectedValueOnce(new Error("History unavailable"))
      .mockResolvedValueOnce(historyItems);

    const { result } = renderHook(() => usePaymentHistory());

    await waitFor(() => {
      expect(result.current.error).toBe("History unavailable");
    });

    expect(typeof result.current.refetch).toBe("function");

    act(() => {
      result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toEqual(historyItems);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("does not update state after the hook is unmounted", async () => {
    let resolveHistory!: (value: PaymentHistoryItem[]) => void;
    (getPaymentHistory as Mock).mockReturnValue(
      new Promise<PaymentHistoryItem[]>((resolve) => {
        resolveHistory = resolve;
      })
    );

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() => usePaymentHistory());
    unmount();

    await act(async () => {
      resolveHistory(historyItems);
      await Promise.resolve();
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
