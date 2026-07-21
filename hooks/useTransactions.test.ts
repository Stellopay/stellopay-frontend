/**
 * @fileoverview Tests for useTransactions hook.
 *
 * Key scenarios covered:
 * - Happy path: data is loaded and exposed correctly.
 * - Loading state transitions (true → false on success/error).
 * - Error handling: API errors surface in `error`, not `data`.
 * - AbortController / race condition: only the latest in-flight request
 *   commits state; a stale earlier response is discarded.
 * - Unmount cleanup: no setState after the component unmounts.
 * - `refetch` trigger re-runs the request.
 * - AbortError from a cancelled request is silently swallowed (not surfaced
 *   as a user-visible error).
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useTransactions } from "./useTransactions";
import * as api from "@/lib/api/transactions";
import { vi, type Mock } from "vitest";

// ── Shared mock payload factories ────────────────────────────────────────────

function makePage(id: string) {
  return {
    data: [{ id }],
    total: 1,
    page: 1,
    pageSize: 6,
    totalPages: 1,
  };
}

// ── Module mock ───────────────────────────────────────────────────────────────

vi.mock("@/lib/api/transactions", () => ({
  getTransactions: vi.fn(),
}));

const mockGetTransactions = api.getTransactions as unknown as Mock;

// ── Helper: controllable promise ──────────────────────────────────────────────

function makeDeferred<T = unknown>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("useTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("starts in a loading state with null data", () => {
    const deferred = makeDeferred();
    mockGetTransactions.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useTransactions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Clean up: resolve so the hook effect doesn't leak.
    act(() => { deferred.resolve(makePage("1")); });
  });

  it("exposes fetched data and clears loading when the request resolves", async () => {
    const payload = makePage("abc");
    mockGetTransactions.mockResolvedValue(payload);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(payload);
    expect(result.current.error).toBeNull();
  });

  it("passes filters, page, and pageSize through to getTransactions", async () => {
    mockGetTransactions.mockResolvedValue(makePage("1"));

    renderHook(() =>
      useTransactions({
        filters: { searchQuery: "stellar", selectedFilter: "Payment Sent" },
        page: 3,
        pageSize: 10,
      }),
    );

    await waitFor(() =>
      expect(mockGetTransactions).toHaveBeenCalledWith(
        {
          filters: { searchQuery: "stellar", selectedFilter: "Payment Sent" },
          page: 3,
          pageSize: 10,
        },
        expect.any(AbortSignal),
      ),
    );
  });

  // ── Error handling ──────────────────────────────────────────────────────────

  it("surfaces API errors in the error field and clears loading", async () => {
    mockGetTransactions.mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Network failure");
    expect(result.current.data).toBeNull();
  });

  it("falls back to a generic error message for non-Error rejections", async () => {
    mockGetTransactions.mockRejectedValue("oops");

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Failed to load transactions");
  });

  it("does NOT surface an AbortError as a user-visible error", async () => {
    // An AbortError is raised by the hook itself when it tears down an
    // in-flight request; it must never appear in `error`.
    mockGetTransactions.mockRejectedValue(
      new DOMException("Aborted", "AbortError"),
    );

    const { result } = renderHook(() => useTransactions());

    // Give the rejection a chance to propagate.
    await act(async () => { await Promise.resolve(); });

    // isLoading stays true because the abort is treated as "no result yet".
    // Crucially, error must remain null.
    expect(result.current.error).toBeNull();
  });

  // ── AbortController / race-condition protection ────────────────────────────

  it("cancels the previous request when filters change (abort is called on old controller)", async () => {
    const signals: AbortSignal[] = [];

    mockGetTransactions.mockImplementation(
      (_params: unknown, signal?: AbortSignal) => {
        if (signal) signals.push(signal);
        // Never settle — keeps in-flight state alive for inspection.
        return new Promise(() => {});
      },
    );

    const { rerender } = renderHook(
      ({ filters }) => useTransactions({ filters }),
      { initialProps: { filters: { searchQuery: "a" } } },
    );

    // First request is in-flight; one signal captured.
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);

    // Change filters → second request should fire and first should be aborted.
    rerender({ filters: { searchQuery: "b" } });

    expect(signals).toHaveLength(2);
    // The first signal must now be aborted.
    expect(signals[0].aborted).toBe(true);
    // The second (latest) signal is still live.
    expect(signals[1].aborted).toBe(false);
  });

  it("only commits the latest result when two requests overlap (race condition)", async () => {
    // Simulate two concurrent requests where the *earlier* one (first) resolves
    // after the *later* one (second).  Only the second result should be kept.
    const first  = makeDeferred<ReturnType<typeof makePage>>();
    const second = makeDeferred<ReturnType<typeof makePage>>();
    let callCount = 0;

    mockGetTransactions.mockImplementation(() => {
      callCount += 1;
      return callCount === 1 ? first.promise : second.promise;
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useTransactions({ filters }),
      { initialProps: { filters: { searchQuery: "a" } } },
    );

    // Both requests in-flight.
    rerender({ filters: { searchQuery: "b" } });

    // The second (latest) resolves first.
    act(() => { second.resolve(makePage("latest")); });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.data[0].id).toBe("latest");

    // The first (stale) resolves later — its result must NOT overwrite.
    act(() => { first.resolve(makePage("stale")); });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.data?.data[0].id).toBe("latest");
  });

  it("discards a stale response even when it resolves much later than the latest", async () => {
    // Same as above but we also verify the hook stays consistent over time.
    const stale  = makeDeferred<ReturnType<typeof makePage>>();
    const latest = makeDeferred<ReturnType<typeof makePage>>();
    let callCount = 0;

    mockGetTransactions.mockImplementation(
      (_params: unknown, signal?: AbortSignal) => {
        callCount += 1;
        // When the signal is aborted, reject so the promise settles.
        const d = callCount === 1 ? stale : latest;
        if (signal) {
          signal.addEventListener("abort", () =>
            d.reject(new DOMException("Aborted", "AbortError")),
          );
        }
        return d.promise;
      },
    );

    const { result, rerender } = renderHook(
      ({ filters }) => useTransactions({ filters }),
      { initialProps: { filters: { searchQuery: "x" } } },
    );

    // Second request supersedes first.
    rerender({ filters: { searchQuery: "y" } });

    // Latest settles first.
    act(() => { latest.resolve(makePage("new")); });
    await waitFor(() => expect(result.current.data?.data[0].id).toBe("new"));

    // Stale eventually resolves — must be a no-op.
    act(() => { stale.resolve(makePage("old")); });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.data?.data[0].id).toBe("new");
  });

  it("passes an AbortSignal to every getTransactions call", async () => {
    mockGetTransactions.mockResolvedValue(makePage("1"));

    renderHook(() => useTransactions());

    await waitFor(() =>
      expect(mockGetTransactions).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(AbortSignal),
      ),
    );
  });

  // ── Unmount cleanup ─────────────────────────────────────────────────────────

  it("aborts the in-flight request on unmount", () => {
    const signals: AbortSignal[] = [];

    mockGetTransactions.mockImplementation(
      (_params: unknown, signal?: AbortSignal) => {
        if (signal) signals.push(signal);
        return new Promise(() => {}); // never settles
      },
    );

    const { unmount } = renderHook(() => useTransactions());

    expect(signals[0].aborted).toBe(false);

    unmount();

    expect(signals[0].aborted).toBe(true);
  });

  it("does not call setState after unmount", async () => {
    const deferred = makeDeferred<ReturnType<typeof makePage>>();
    mockGetTransactions.mockReturnValue(deferred.promise);

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { unmount } = renderHook(() => useTransactions());

    unmount();

    // Resolving after unmount must not trigger React's "state update on
    // unmounted component" warning (or any console.error at all).
    act(() => { deferred.resolve(makePage("1")); });
    await act(async () => { await Promise.resolve(); });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // ── refetch ─────────────────────────────────────────────────────────────────

  it("re-runs the request and updates data when refetch is called", async () => {
    const first  = makePage("first");
    const second = makePage("second");

    mockGetTransactions
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data[0].id).toBe("first");

    act(() => { result.current.refetch(); });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data[0].id).toBe("second");
  });

  it("exposes a stable refetch callback reference across renders", async () => {
    mockGetTransactions.mockResolvedValue(makePage("1"));

    const { result, rerender } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ref1 = result.current.refetch;
    rerender();
    const ref2 = result.current.refetch;

    expect(ref1).toBe(ref2);
  });
});
