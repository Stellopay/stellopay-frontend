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

  it("retries on transient failure and succeeds without surfacing error", async () => {
    vi.useFakeTimers();

    (getPaymentHistory as Mock)
      .mockRejectedValueOnce(new Error("Network blip"))
      .mockResolvedValue(historyItems);

    const { result } = renderHook(() => usePaymentHistory());

    await act(() => {});

    await act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(result.current.data).toEqual(historyItems);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);

    vi.useRealTimers();
  });

  it("surfaces error after exhausting all retries", async () => {
    vi.useFakeTimers();

    (getPaymentHistory as Mock).mockRejectedValue(new Error("Server down"));

    const { result } = renderHook(() => usePaymentHistory());

    await act(() => {});

    for (let i = 0; i < 3; i++) {
      await act(() => {
        vi.advanceTimersToNextTimer();
      });
    }

    expect(result.current.error).toBe("Server down");
    expect(result.current.isLoading).toBe(false);

    vi.useRealTimers();
  });

  it("manual refetch resets the retry counter and recovers", async () => {
    vi.useFakeTimers();

    let callCount = 0;
    (getPaymentHistory as Mock).mockImplementation(() => {
      callCount++;
      if (callCount <= 4) return Promise.reject(new Error("Fail"));
      return Promise.resolve(historyItems);
    });

    const { result } = renderHook(() => usePaymentHistory());

    await act(() => {});

    for (let i = 0; i < 3; i++) {
      await act(() => {
        vi.advanceTimersToNextTimer();
      });
    }

    expect(result.current.error).toBe("Fail");
    expect(result.current.isLoading).toBe(false);

    vi.useRealTimers();

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(historyItems);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("cancels pending retry timer when refetch is called manually", async () => {
    vi.useFakeTimers();

    (getPaymentHistory as Mock)
      .mockRejectedValueOnce(new Error("Fail"))
      .mockResolvedValue(historyItems);

    const { result } = renderHook(() => usePaymentHistory());

    await act(() => {});

    act(() => {
      result.current.refetch();
    });

    await act(() => {});

    expect(result.current.data).toEqual(historyItems);
    expect(result.current.isLoading).toBe(false);

    vi.useRealTimers();
  });

  it("clears pending retry timer on unmount", async () => {
    vi.useFakeTimers();

    (getPaymentHistory as Mock).mockRejectedValue(new Error("Fail"));

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => usePaymentHistory());

    await act(() => {});

    unmount();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    vi.useRealTimers();
  });

  it("ignores rejection after the hook has been unmounted", async () => {
    let rejectFn!: (err: Error) => void;
    (getPaymentHistory as Mock).mockImplementation(
      () => new Promise<PaymentHistoryItem[]>((_, reject) => {
        rejectFn = reject;
      })
    );

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => usePaymentHistory());
    unmount();

    await act(async () => {
      rejectFn(new Error("Delayed fail"));
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("ignores rejection from stale request after refetch", async () => {
    let rejectFn!: (err: Error) => void;
    (getPaymentHistory as Mock).mockImplementation(
      () => new Promise<PaymentHistoryItem[]>((_, reject) => {
        rejectFn = reject;
      })
    );

    const { result } = renderHook(() => usePaymentHistory());

    act(() => {
      result.current.refetch();
    });

    await act(async () => {
      rejectFn(new Error("Stale error"));
    });

    expect(result.current.error).toBeNull();
  });

  it("displays fallback error message for non-Error rejection", async () => {
    vi.useFakeTimers();

    (getPaymentHistory as Mock).mockRejectedValue("string error");

    const { result } = renderHook(() => usePaymentHistory());

    await act(() => {});

    for (let i = 0; i < 3; i++) {
      await act(() => {
        vi.advanceTimersToNextTimer();
      });
    }

    expect(result.current.error).toBe("Failed to load payment history");
    expect(result.current.isLoading).toBe(false);

    vi.useRealTimers();
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
