import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { useTransaction } from "./useTransaction";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getTransactionById: vi.fn(),
}));

const mockGetTransactionById = vi.mocked(api.getTransactionById);

const transaction = {
  id: "1",
  type: "Payment Sent",
  txId: "hash-1",
  address: "GABC",
  date: "2026-01-01",
  time: "10:00",
  token: "XLM",
  amount: -3,
  status: "Completed",
  statusColor: "success" as const,
};

describe("useTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a transaction and passes an abort signal", async () => {
    mockGetTransactionById.mockResolvedValue(transaction);

    const { result } = renderHook(() => useTransaction("1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(transaction);
    expect(mockGetTransactionById).toHaveBeenCalledWith(
      "1",
      expect.any(AbortSignal),
    );
  });

  it("exposes invalid-id API errors", async () => {
    mockGetTransactionById.mockRejectedValue(
      Object.assign(new Error("Transaction not found"), {
        code: "TRANSACTION_NOT_FOUND",
      }),
    );

    const { result } = renderHook(() => useTransaction(""));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe("Transaction not found");
    expect(result.current.data).toBeNull();
  });

  it("aborts the prior request when the id changes", () => {
    const signals: AbortSignal[] = [];
    mockGetTransactionById.mockImplementation((_id, signal) => {
      if (signal) signals.push(signal);
      return new Promise(() => {});
    });

    const { rerender } = renderHook(({ id }) => useTransaction(id), {
      initialProps: { id: "1" },
    });

    rerender({ id: "2" });
    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("aborts an in-flight request on unmount", () => {
    let signal: AbortSignal | undefined;
    mockGetTransactionById.mockImplementation((_id, requestSignal) => {
      signal = requestSignal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useTransaction("1"));
    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("refetches the same id", async () => {
    mockGetTransactionById
      .mockResolvedValueOnce(transaction)
      .mockResolvedValueOnce({ ...transaction, status: "Pending" });

    const { result } = renderHook(() => useTransaction("1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.data?.status).toBe("Pending"));
    expect(mockGetTransactionById).toHaveBeenCalledTimes(2);
  });
});
