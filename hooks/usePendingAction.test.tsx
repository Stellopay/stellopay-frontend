import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePendingAction } from "./usePendingAction";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("usePendingAction", () => {
  it("starts idle with no error", () => {
    const { result } = renderHook(() => usePendingAction());
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("marks pending while the action runs and clears it afterwards", async () => {
    const d = deferred<void>();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => usePendingAction());

    let runPromise: Promise<boolean> | undefined;
    act(() => {
      runPromise = result.current.run(action);
    });

    expect(result.current.isPending).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => d.resolve());
    const succeeded = await runPromise;
    expect(succeeded).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ignores a second run while one is still in flight (the action runs once)", async () => {
    const d = deferred<void>();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => usePendingAction());

    let first: Promise<boolean> | undefined;
    let second: Promise<boolean> | undefined;
    act(() => {
      first = result.current.run(action);
      second = result.current.run(action);
    });
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => d.resolve());
    expect(await first).toBe(true);
    expect(await second).toBe(false);
  });

  it("surfaces a rejection and returns false so the caller can retry", async () => {
    const action = vi.fn(() => Promise.reject(new Error("Network down")));
    const { result } = renderHook(() => usePendingAction());

    let runPromise: Promise<boolean> | undefined;
    act(() => {
      runPromise = result.current.run(action);
    });

    await act(async () => {
      await runPromise;
    });
    expect(result.current.error).toBe("Network down");
    expect(result.current.isPending).toBe(false);
  });

  it("uses the generic message when a rejection carries no error message", async () => {
    const action = vi.fn(() => Promise.reject(new Error("")));
    const { result } = renderHook(() =>
      usePendingAction({ genericErrorMessage: "Nope." }),
    );

    await act(async () => {
      await result.current.run(action);
    });

    expect(result.current.error).toBe("Nope.");
  });

  it("re-runs after a failure when asked (retry path)", async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => usePendingAction());

    let first: Promise<boolean> | undefined;
    let second: Promise<boolean> | undefined;
    await act(async () => {
      first = result.current.run(action);
      second = undefined;
    });
    await act(async () => {
      await first;
    });
    expect(result.current.error).not.toBeNull();
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      second = result.current.run(action);
    });
    await act(async () => {
      await second;
    });
    expect(result.current.error).toBeNull();
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("reset clears a stored error", async () => {
    const action = vi.fn(() => Promise.reject(new Error("boom")));
    const { result } = renderHook(() => usePendingAction());

    await act(async () => {
      await result.current.run(action);
    });
    expect(result.current.error).toBe("boom");

    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });
});
