import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useTransactions } from "./useTransactions";
import * as api from "@/lib/api/transactions";

import { vi, type Mock } from "vitest";

vi.mock("@/lib/api/transactions", () => {

  return {
    getTransactions: vi.fn(),
  };
});

describe("useTransactions cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only commits the latest overlapping request result", async () => {
    // Two overlapping calls:
    // - first resolves after 1000ms
    // - second resolves after 100ms (latest intent)
    const first = { data: [{ id: "1" }], total: 1, page: 1, pageSize: 6, totalPages: 1 };
    const second = {
      data: [{ id: "2" }],
      total: 1,
      page: 1,
      pageSize: 6,
      totalPages: 1,
    };

    let firstResolve!: (v: any) => void;
    let secondResolve!: (v: any) => void;

    (api.getTransactions as unknown as Mock).mockImplementation(
      (_params: any, _signal?: AbortSignal) => {
        if (!(api.getTransactions as unknown as Mock).mock.calls.length) {
          // not used
        }

        const callIndex = (api.getTransactions as unknown as Mock).mock.calls
          .length;

        return new Promise((resolve) => {
          if (callIndex === 1) {
            firstResolve = resolve;
          } else {
            secondResolve = resolve;
          }
        });
      }
    );

    const { result, rerender } = renderHook(
      ({ page, filters }) => useTransactions({ page, filters }),
      {
        initialProps: {
          page: 1,
          filters: { searchQuery: "a" },
        },
      }
    );

    // Trigger second request via rerender with new filters
    rerender({ page: 1, filters: { searchQuery: "b" } });

    expect(result.current.isLoading).toBe(true);

    // Latest (second) resolves first
    act(() => {
      secondResolve(second);
      vi.advanceTimersByTime(100);
    });

    // Allow microtasks
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data?.data[0].id).toBe("2");

    // First resolves later; should NOT overwrite
    act(() => {
      firstResolve(first);
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data?.data[0].id).toBe("2");
  });

  it("does not call setState after unmount", async () => {
    const payload = {
      data: [{ id: "1" }],
      total: 1,
      page: 1,
      pageSize: 6,
      totalPages: 1,
    };

    let resolveFn!: (v: any) => void;
    (api.getTransactions as unknown as Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        })
    );

    const setStateSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() =>
      useTransactions({ filters: { searchQuery: "a" }, page: 1 })
    );

    unmount();

    // Resolve after unmount
    act(() => {
      resolveFn(payload);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // React warns with "act"/"state update on unmounted component" in console.error.
    expect(setStateSpy).not.toHaveBeenCalled();

    setStateSpy.mockRestore();
  });
});

