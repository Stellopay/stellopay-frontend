/**
 * context/wallet-context.freighter.test.tsx
 *
 * Tests for the Freighter-specific additions to WalletProvider:
 * connectFreighter(), freighterStatus, freighterError, and the
 * WatchWalletChanges-based change watcher.
 *
 * All @stellar/freighter-api calls go through the adapter, which is mocked
 * via vi.mock('@/lib/stellar/freighter') so no browser extension is required.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import {
  WalletProvider,
  useWallet,
  SUPPORTED_NETWORKS,
} from "@/context/wallet-context";
import {
  FreighterNotInstalledError,
  FreighterUserRejectedError,
} from "@/lib/stellar/freighter";

// ---------------------------------------------------------------------------
// Mock the Freighter adapter
// ---------------------------------------------------------------------------
vi.mock("@/lib/stellar/freighter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/freighter")>();
  return {
    ...actual,
    isFreighterInstalled: vi.fn().mockResolvedValue(false),
    requestFreighterAccess: vi.fn(),
    watchFreighterChanges: vi.fn().mockReturnValue(() => {}),
  };
});

import {
  isFreighterInstalled,
  requestFreighterAccess,
  watchFreighterChanges,
} from "@/lib/stellar/freighter";

const mockIsFreighterInstalled = isFreighterInstalled as ReturnType<typeof vi.fn>;
const mockRequestFreighterAccess = requestFreighterAccess as ReturnType<typeof vi.fn>;
const mockWatchFreighterChanges = watchFreighterChanges as ReturnType<typeof vi.fn>;

const VALID_ADDRESS = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

function wrap(children: React.ReactNode) {
  return <WalletProvider>{children}</WalletProvider>;
}

// ---------------------------------------------------------------------------
// connectFreighter — success path
// ---------------------------------------------------------------------------

describe("WalletProvider.connectFreighter – success", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    mockRequestFreighterAccess.mockResolvedValue(VALID_ADDRESS);
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("sets the address and returns true on successful connection", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    let success = false;
    await act(async () => {
      success = await result.current.connectFreighter();
    });

    expect(success).toBe(true);
    expect(result.current.address).toBe(VALID_ADDRESS);
    expect(result.current.isConnected).toBe(true);
  });

  it("sets freighterStatus back to idle after success", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await result.current.connectFreighter();
    });

    expect(result.current.freighterStatus).toBe("idle");
    expect(result.current.freighterError).toBeNull();
  });

  it("stores only the public G-address (not a secret key)", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await result.current.connectFreighter();
    });

    // The stored address must start with G and not look like a secret key
    expect(result.current.address).toMatch(/^G[A-Z0-9]+/);
    expect(result.current.address).not.toMatch(/^S[A-Z2-7]+$/);
  });
});

// ---------------------------------------------------------------------------
// connectFreighter — not installed
// ---------------------------------------------------------------------------

describe("WalletProvider.connectFreighter – not installed", () => {
  beforeEach(() => {
    mockRequestFreighterAccess.mockRejectedValue(
      new FreighterNotInstalledError(),
    );
    mockIsFreighterInstalled.mockResolvedValue(false);
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("returns false and does not set an address", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    let success = true;
    await act(async () => {
      success = await result.current.connectFreighter();
    });

    expect(success).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it("sets freighterStatus to not_installed", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await result.current.connectFreighter();
    });

    expect(result.current.freighterStatus).toBe("not_installed");
  });

  it("does not throw to the caller", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await expect(
      act(async () => {
        await result.current.connectFreighter();
      }),
    ).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// connectFreighter — user rejected
// ---------------------------------------------------------------------------

describe("WalletProvider.connectFreighter – user rejected", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    mockRequestFreighterAccess.mockRejectedValue(
      new FreighterUserRejectedError(),
    );
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("returns false and leaves the wallet disconnected", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    let success = true;
    await act(async () => {
      success = await result.current.connectFreighter();
    });

    expect(success).toBe(false);
    expect(result.current.isConnected).toBe(false);
  });

  it("sets freighterStatus to rejected", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await result.current.connectFreighter();
    });

    expect(result.current.freighterStatus).toBe("rejected");
  });

  it("does not throw to the caller", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await expect(
      act(async () => {
        await result.current.connectFreighter();
      }),
    ).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// connectFreighter — unexpected error
// ---------------------------------------------------------------------------

describe("WalletProvider.connectFreighter – unexpected error", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    mockRequestFreighterAccess.mockRejectedValue(
      new Error("Unexpected extension crash"),
    );
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("returns false and sets freighterStatus to error", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    let success = true;
    await act(async () => {
      success = await result.current.connectFreighter();
    });

    expect(success).toBe(false);
    expect(result.current.freighterStatus).toBe("error");
  });

  it("stores the error message in freighterError", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await result.current.connectFreighter();
    });

    expect(result.current.freighterError).toBe("Unexpected extension crash");
  });
});

// ---------------------------------------------------------------------------
// connectFreighter — rejects secret-key-looking addresses
// ---------------------------------------------------------------------------

describe("WalletProvider.connectFreighter – secret key guard", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    // A spoofed extension returning a secret key instead of a public address
    mockRequestFreighterAccess.mockResolvedValue(
      "SAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDGD",
    );
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("returns false and sets freighterStatus to error", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    let success = true;
    await act(async () => {
      success = await result.current.connectFreighter();
    });

    expect(success).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.freighterStatus).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// connectFreighter — invalid address
// ---------------------------------------------------------------------------

describe("WalletProvider.connectFreighter – invalid address", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    mockRequestFreighterAccess.mockResolvedValue("not-a-stellar-address");
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("returns false and sets freighterStatus to error", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    let success = true;
    await act(async () => {
      success = await result.current.connectFreighter();
    });

    expect(success).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.freighterStatus).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// disconnect — resets freighterStatus
// ---------------------------------------------------------------------------

describe("WalletProvider disconnect – resets Freighter state", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    mockRequestFreighterAccess.mockResolvedValue(VALID_ADDRESS);
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("clears freighterStatus and freighterError on disconnect", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await result.current.connectFreighter();
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.freighterStatus).toBe("idle");
    expect(result.current.freighterError).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Network change via Freighter watcher
// ---------------------------------------------------------------------------

describe("WalletProvider – Freighter network watcher", () => {
  it("wires up watchFreighterChanges when no external subscriptions are provided", async () => {
    mockWatchFreighterChanges.mockReturnValue(() => {});
    mockIsFreighterInstalled.mockResolvedValue(true);

    renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    // Give the async isFreighterInstalled check time to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockWatchFreighterChanges).toHaveBeenCalled();
  });

  it("does NOT set up the Freighter watcher when subscribeToNetworkChanges is provided", async () => {
    mockWatchFreighterChanges.mockClear();
    mockIsFreighterInstalled.mockResolvedValue(true);

    const subscribe = vi.fn(() => () => {});

    renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockWatchFreighterChanges).not.toHaveBeenCalled();
  });

  it("calls the returned stop function on unmount", async () => {
    const stopFn = vi.fn();
    mockWatchFreighterChanges.mockReturnValue(stopFn);
    mockIsFreighterInstalled.mockResolvedValue(true);

    const { unmount } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    unmount();

    expect(stopFn).toHaveBeenCalled();
  });

  it("updates network when the watcher fires a supported network change", async () => {
    let watcherCb: ((state: { address: string; network: { id: string; name: string } | null; networkPassphrase: string }) => void) | null = null;
    mockWatchFreighterChanges.mockImplementation((cb) => {
      watcherCb = cb;
      return () => {};
    });
    mockIsFreighterInstalled.mockResolvedValue(true);

    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    // Simulate the watcher reporting a testnet change
    act(() => {
      watcherCb?.({
        address: VALID_ADDRESS,
        network: SUPPORTED_NETWORKS.find((n) => n.id === "testnet")!,
        networkPassphrase: "Test SDF Network ; September 2015",
      });
    });

    expect(result.current.network.id).toBe("testnet");
    expect(result.current.isUnsupportedNetwork).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// capabilities — computed from Freighter connection state
// ---------------------------------------------------------------------------

describe("WalletProvider capabilities with Freighter providerCapabilities", () => {
  beforeEach(() => {
    mockIsFreighterInstalled.mockResolvedValue(true);
    mockRequestFreighterAccess.mockResolvedValue(VALID_ADDRESS);
    mockWatchFreighterChanges.mockReturnValue(() => {});
  });

  it("canSignTransaction is true after connectFreighter succeeds with the right providerCapabilities", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider
          providerCapabilities={{
            canSignTransaction: true,
            canSignMessage: true,
            canSwitchNetwork: true,
          }}
        >
          {children}
        </WalletProvider>
      ),
    });

    await act(async () => {
      await result.current.connectFreighter();
    });

    expect(result.current.capabilities.canSignTransaction).toBe(true);
    expect(result.current.capabilities.canSignMessage).toBe(true);
  });

  it("capabilities remain false when disconnected even with providerCapabilities set", async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider
          providerCapabilities={{
            canSignTransaction: true,
            canSignMessage: true,
          }}
        >
          {children}
        </WalletProvider>
      ),
    });

    expect(result.current.capabilities.canSignTransaction).toBe(false);
  });
});
