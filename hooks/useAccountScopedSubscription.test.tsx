import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { useAccountScopedSubscription } from "./useAccountScopedSubscription";
import { realtimeRegistry } from "@/lib/realtime-registry";
import { useWallet } from "@/context/wallet-context";

vi.mock("@/context/wallet-context", () => ({
  useWallet: vi.fn(),
}));

const NETWORK_ID = "stellar";
const ADDRESS_A = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
const ADDRESS_B = "G" + "B".repeat(55);
const CHANNEL = "transactions";

function mockWallet(address: string | null) {
  (useWallet as Mock).mockReturnValue({
    address,
    network: { id: NETWORK_ID },
  });
}

describe("useAccountScopedSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtimeRegistry.clear();
  });

  it("does not subscribe while logged out", () => {
    mockWallet(null);
    renderHook(() => useAccountScopedSubscription(CHANNEL, () => undefined));
    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(0);
  });

  it("subscribes to the channel for the current account scope", () => {
    mockWallet(ADDRESS_A);
    renderHook(() => useAccountScopedSubscription(CHANNEL, vi.fn()));

    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(1);
    expect(realtimeRegistry.getChannelScope(CHANNEL)).toBe(
      `${NETWORK_ID}:${ADDRESS_A}`,
    );
  });

  it("delivers emitted payloads to the listener of the current account", () => {
    mockWallet(ADDRESS_A);
    const listener = vi.fn();
    renderHook(() => useAccountScopedSubscription(CHANNEL, listener));

    act(() => {
      realtimeRegistry.emit(CHANNEL, { id: "tx-1" });
    });

    expect(listener).toHaveBeenCalledExactlyOnceWith({ id: "tx-1" });
  });

  it("re-renders with a new listener identity keep a single subscription per view", () => {
    mockWallet(ADDRESS_A);
    const firstListener = vi.fn();
    const secondListener = vi.fn();

    const { rerender } = renderHook(
      ({ listener }) => useAccountScopedSubscription(CHANNEL, listener),
      { initialProps: { listener: firstListener } },
    );

    rerender({ listener: secondListener });

    // Listener identity change must not open a second channel.
    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(1);

    act(() => {
      realtimeRegistry.emit(CHANNEL, "event");
    });

    // The latest listener receives events; the stale one is detached.
    expect(secondListener).toHaveBeenCalledExactlyOnceWith("event");
    expect(firstListener).not.toHaveBeenCalled();
  });

  it("unsubscribes from the previous account and subscribes under the new scope on account switch", () => {
    mockWallet(ADDRESS_A);
    const accountAListener = vi.fn();
    const accountBListener = vi.fn();

    const { rerender } = renderHook(
      ({ listener }) => useAccountScopedSubscription(CHANNEL, listener),
      { initialProps: { listener: accountAListener } },
    );

    mockWallet(ADDRESS_B);
    rerender({ listener: accountBListener });

    // Exactly one subscription remains, now owned by the new account.
    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(1);
    expect(realtimeRegistry.getChannelScope(CHANNEL)).toBe(
      `${NETWORK_ID}:${ADDRESS_B}`,
    );
    expect(realtimeRegistry.getListenerCount(CHANNEL)).toBe(1);

    // Events on the channel reach only the current account's listener — the
    // previous account's listener is fully detached after the switch.
    act(() => {
      realtimeRegistry.emit(CHANNEL, "event");
    });
    expect(accountBListener).toHaveBeenCalledExactlyOnceWith("event");
    expect(accountAListener).not.toHaveBeenCalled();
  });

  it("removes the listener on logout (scope becomes null)", () => {
    mockWallet(ADDRESS_A);
    const listener = vi.fn();

    const { rerender } = renderHook(() =>
      useAccountScopedSubscription(CHANNEL, listener),
    );

    mockWallet(null);
    rerender();

    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(0);

    act(() => {
      realtimeRegistry.emit(CHANNEL, "after-logout");
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it("removes the listener on unmount", () => {
    mockWallet(ADDRESS_A);
    const listener = vi.fn();

    const { unmount } = renderHook(() =>
      useAccountScopedSubscription(CHANNEL, listener),
    );

    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(1);

    unmount();

    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(0);
    expect(realtimeRegistry.getListenerCount(CHANNEL)).toBe(0);

    act(() => {
      realtimeRegistry.emit(CHANNEL, "after-unmount");
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it("reconnect after unmount opens exactly one subscription per view", () => {
    mockWallet(ADDRESS_A);
    const { unmount } = renderHook(() =>
      useAccountScopedSubscription(CHANNEL, vi.fn()),
    );
    unmount();
    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(0);

    // Reconnect — the same view subscribes again without stacking duplicates.
    renderHook(() => useAccountScopedSubscription(CHANNEL, vi.fn()));
    expect(realtimeRegistry.getActiveChannelCount(CHANNEL)).toBe(1);
  });
});
