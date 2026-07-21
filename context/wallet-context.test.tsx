import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import {
  DEFAULT_NETWORK,
  SUPPORTED_NETWORKS,
  WalletProvider,
  formatAddress,
  useWallet,
} from "@/context/wallet-context";
import { WALLET_NETWORK_STORAGE_KEY } from "@/types/wallet";

// Stellar is the only supported network now that the placeholder EVM chains
// have been removed, so network-switching/persistence is exercised against it.
const STELLAR = SUPPORTED_NETWORKS.find((n) => n.id === "stellar")!;
const STORAGE_KEY = "stellopay.wallet.network";

function wrap(children: React.ReactNode) {
  return <WalletProvider>{children}</WalletProvider>;
}

// ─── Legacy SUPPORTED_NETWORKS shape tests (kept for regression coverage) ────

describe("SUPPORTED_NETWORKS", () => {
  it("includes Stellar", () => {
    const ids = SUPPORTED_NETWORKS.map((n) => n.id);
    expect(ids).toContain("stellar");
  });

  it("does not include any EVM chain ids", () => {
    const ids = SUPPORTED_NETWORKS.map((n) => n.id);
    for (const evmId of ["eth", "ethereum", "polygon", "bsc", "arbitrum"]) {
      expect(ids).not.toContain(evmId);
    }
  });

  it("does not include any EVM chain names", () => {
    const names = SUPPORTED_NETWORKS.map((n) => n.name.toLowerCase());
    for (const evmName of ["ethereum", "polygon", "bsc", "arbitrum", "eth"]) {
      expect(names).not.toContain(evmName);
    }
  });
});

// ─── DEFAULT_NETWORK ─────────────────────────────────────────────────────────

describe("DEFAULT_NETWORK", () => {
  it("is Stellar", () => {
    expect(DEFAULT_NETWORK.id).toBe("stellar");
    expect(DEFAULT_NETWORK.name).toBe("Stellar");
  });

  it("is the first entry in SUPPORTED_NETWORKS", () => {
    expect(DEFAULT_NETWORK).toEqual(SUPPORTED_NETWORKS[0]);
  });
});

// ─── WALLET_NETWORK_STORAGE_KEY export ───────────────────────────────────────

describe("WALLET_NETWORK_STORAGE_KEY", () => {
  it("is exported from @/types/wallet", () => {
    expect(typeof WALLET_NETWORK_STORAGE_KEY).toBe("string");
    expect(WALLET_NETWORK_STORAGE_KEY.length).toBeGreaterThan(0);
  });
});

// ─── WalletProvider ───────────────────────────────────────────────────────────

describe("WalletProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("starts disconnected with the default network", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.network.id).toBe(DEFAULT_NETWORK.id);
  });

  it("connect populates a synthetic Stellar address and flips isConnected", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    act(() => {
      result.current.connect();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toMatch(/^G[A-Z0-9]+/);
  });

  it("connect accepts a caller-supplied public G-address", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    const publicAddress =
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW";

    act(() => {
      result.current.connect(publicAddress);
    });

    expect(result.current.address).toBe(publicAddress);
  });

  it("connect rejects values that look like a Stellar secret key", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    const fakeSecret = "S" + "A".repeat(55);

    expect(() => {
      act(() => {
        result.current.connect(fakeSecret);
      });
    }).toThrow(/secret key/i);
    expect(result.current.address).toBeNull();
  });

  it("disconnect clears the address", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    act(() => {
      result.current.connect();
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.disconnect();
    });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
  });

  it("setNetwork updates the network and persists the id", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    act(() => {
      result.current.setNetwork(STELLAR);
    });

    expect(result.current.network.id).toBe("stellar");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("stellar");
  });

  it("hydrates the network from localStorage on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "stellar");

    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    expect(result.current.network.id).toBe("stellar");
  });

  it("ignores unknown network ids in storage", () => {
    window.localStorage.setItem(STORAGE_KEY, "made-up-network");

    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    expect(result.current.network.id).toBe(DEFAULT_NETWORK.id);
  });

  it("does not persist a secret-looking value even if forced through state", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    const fakeSecret = "S" + "A".repeat(55);
    expect(() => {
      act(() => {
        result.current.connect(fakeSecret);
      });
    }).toThrow();
    expect(window.localStorage.getItem("stellopay.wallet.address")).toBeNull();
  });
});

describe("useWallet outside provider", () => {
  it("throws a clear error", () => {
    expect(() => renderHook(() => useWallet())).toThrow(
      /useWallet must be used within a WalletProvider/,
    );
  });
});

describe("formatAddress", () => {
  it("truncates long Stellar addresses", () => {
    expect(formatAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZF123")).toBe("GABC...F123");
  });

  it("returns empty string for null", () => {
    expect(formatAddress(null)).toBe("");
  });

  it("leaves short values untouched", () => {
    expect(formatAddress("G123")).toBe("G123");
  });
});

describe("WalletProvider storage edge cases", () => {
  // jsdom exposes localStorage as a getter on the window prototype. Replacing
  // it with a throwing stub forces the provider's try/catch paths to fire so
  // we exercise the failure branches and meet the 95% coverage gate.
  function withStubbedLocalStorage<T>(stub: Storage, body: () => T): T {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "localStorage",
    );
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => stub,
    });
    try {
      return body();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, "localStorage", originalDescriptor);
      }
    }
  }

  const throwingStorage = {
    getItem: () => {
      throw new Error("storage blocked");
    },
    setItem: () => {
      throw new Error("quota exceeded");
    },
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as unknown as Storage;

  it("survives a localStorage.getItem that throws on hydrate", () => {
    withStubbedLocalStorage(throwingStorage, () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: ({ children }) => wrap(children),
      });
      expect(result.current.network.id).toBe(DEFAULT_NETWORK.id);
    });
  });

  it("survives a localStorage.setItem that throws on persist", () => {
    withStubbedLocalStorage(throwingStorage, () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: ({ children }) => wrap(children),
      });
      expect(() => {
        act(() => {
          result.current.setNetwork(STELLAR);
        });
      }).not.toThrow();
      expect(result.current.network.id).toBe("stellar");
    });
  });

  it("falls back to defaults when localStorage is missing the API surface", () => {
    const partial = {} as unknown as Storage;
    withStubbedLocalStorage(partial, () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: ({ children }) => wrap(children),
      });
      expect(result.current.network.id).toBe(DEFAULT_NETWORK.id);
      expect(() => {
        act(() => {
          result.current.setNetwork(STELLAR);
        });
      }).not.toThrow();
    });
  });

  it("does not crash when localStorage.getItem throws (render-based)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    function WalletConsumer() {
      const { network } = useWallet();
      return <span data-testid="network-id">{network.id}</span>;
    }

    expect(() =>
      render(
        <WalletProvider>
          <WalletConsumer />
        </WalletProvider>,
      ),
    ).not.toThrow();

    vi.restoreAllMocks();
  });
});

describe("WalletProvider initial props", () => {
  it("respects initialAddress for SSR seeding", () => {
    const seeded = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW";
    function Probe() {
      const { address, isConnected } = useWallet();
      return (
        <span data-testid="probe">
          {isConnected ? `connected:${address}` : "disconnected"}
        </span>
      );
    }

    render(
      <WalletProvider initialAddress={seeded}>
        <Probe />
      </WalletProvider>,
    );

    expect(screen.getByTestId("probe").textContent).toBe(
      `connected:${seeded}`,
    );
  });
});

// ─── Network-change event handling ───────────────────────────────────────────
//
// WalletProvider accepts a subscribeToNetworkChanges prop so wallet SDKs
// (Freighter, WalletConnect, etc.) can push network-change events into the
// context without requiring a manual reconnect.

describe("WalletProvider – network-change event handling", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  /**
   * Builds a minimal event-emitter stand-in that records the callback
   * registered by WalletProvider, letting tests fire it at will.
   */
  function makeNetworkEmitter() {
    let _cb: ((networkId: string) => void) | null = null;
    const subscribe = vi.fn((cb: (networkId: string) => void) => {
      _cb = cb;
      return () => { _cb = null; }; // cleanup
    });
    const emit = (networkId: string) => { _cb?.(networkId); };
    return { subscribe, emit };
  }

  it("registers the subscription on mount", () => {
    const { subscribe } = makeNetworkEmitter();
    renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });
    expect(subscribe).toHaveBeenCalledOnce();
  });

  it("calls the cleanup function returned by subscribeToNetworkChanges on unmount", () => {
    const cleanup = vi.fn();
    const subscribe = vi.fn(() => cleanup);
    const { unmount } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("updates network state when a supported network-change event fires", () => {
    const { subscribe, emit } = makeNetworkEmitter();
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });

    act(() => { emit("stellar"); });

    expect(result.current.network.id).toBe("stellar");
    expect(result.current.isUnsupportedNetwork).toBe(false);
  });

  it("persists the new network to localStorage when a supported network-change event fires", () => {
    const { subscribe, emit } = makeNetworkEmitter();
    renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });

    act(() => { emit("stellar"); });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("stellar");
  });

  it("sets isUnsupportedNetwork=true when an unsupported network id is emitted", () => {
    const { subscribe, emit } = makeNetworkEmitter();
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });

    act(() => { emit("ethereum"); });

    expect(result.current.isUnsupportedNetwork).toBe(true);
  });

  it("does not update the network id when an unsupported network is emitted", () => {
    const { subscribe, emit } = makeNetworkEmitter();
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });

    const previousId = result.current.network.id;
    act(() => { emit("polygon"); });

    // Network id must not change to an unsupported value.
    expect(result.current.network.id).toBe(previousId);
  });

  it("clears isUnsupportedNetwork when switching back to a supported network", () => {
    const { subscribe, emit } = makeNetworkEmitter();
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => (
        <WalletProvider subscribeToNetworkChanges={subscribe}>
          {children}
        </WalletProvider>
      ),
    });

    act(() => { emit("ethereum"); });
    expect(result.current.isUnsupportedNetwork).toBe(true);

    act(() => { emit("stellar"); });
    expect(result.current.isUnsupportedNetwork).toBe(false);
    expect(result.current.network.id).toBe("stellar");
  });

  it("does not subscribe when subscribeToNetworkChanges is not provided", () => {
    // Simply verify the provider renders without error and isUnsupportedNetwork
    // defaults to false when no subscription prop is given.
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => <WalletProvider>{children}</WalletProvider>,
    });
    expect(result.current.isUnsupportedNetwork).toBe(false);
  });

  it("handles a subscription that returns void (no cleanup) without throwing", () => {
    const subscribe = vi.fn((_cb: (id: string) => void) => {
      // intentionally returns void instead of a cleanup function
    });
    expect(() => {
      const { unmount } = renderHook(() => useWallet(), {
        wrapper: ({ children }) => (
          <WalletProvider subscribeToNetworkChanges={subscribe}>
            {children}
          </WalletProvider>
        ),
      });
      unmount();
    }).not.toThrow();
  });
});

// ─── isUnsupportedNetwork via setNetwork ─────────────────────────────────────

describe("WalletProvider – isUnsupportedNetwork via setNetwork", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("starts with isUnsupportedNetwork=false", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });
    expect(result.current.isUnsupportedNetwork).toBe(false);
  });

  it("sets isUnsupportedNetwork=true when setNetwork is called with an unsupported network", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    act(() => {
      result.current.setNetwork({ id: "arbitrum", name: "Arbitrum" });
    });

    expect(result.current.isUnsupportedNetwork).toBe(true);
  });

  it("keeps isUnsupportedNetwork=false when setNetwork is called with a supported network", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    act(() => {
      result.current.setNetwork(STELLAR);
    });

    expect(result.current.isUnsupportedNetwork).toBe(false);
  });

  it("clears isUnsupportedNetwork when switching back to a supported network via setNetwork", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    act(() => {
      result.current.setNetwork({ id: "bsc", name: "BSC" });
    });
    expect(result.current.isUnsupportedNetwork).toBe(true);

    act(() => {
      result.current.setNetwork(STELLAR);
    });
    expect(result.current.isUnsupportedNetwork).toBe(false);
  });

  it("does not persist an unsupported network to localStorage", () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    act(() => {
      result.current.setNetwork({ id: "arbitrum", name: "Arbitrum" });
    });

    // Unsupported networks must not be written to storage.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
