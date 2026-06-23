import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React from "react";

import {
  DEFAULT_NETWORK,
  SUPPORTED_NETWORKS,
  WalletProvider,
  formatAddress,
  useWallet,
} from "@/context/wallet-context";

const POLYGON = SUPPORTED_NETWORKS.find((n) => n.id === "polygon")!;
const STORAGE_KEY = "stellopay.wallet.network";

function wrap(children: React.ReactNode) {
  return <WalletProvider>{children}</WalletProvider>;
}

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
      result.current.setNetwork(POLYGON);
    });

    expect(result.current.network.id).toBe("polygon");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("polygon");
  });

  it("hydrates the network from localStorage on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "polygon");

    const { result } = renderHook(() => useWallet(), {
      wrapper: ({ children }) => wrap(children),
    });

    expect(result.current.network.id).toBe("polygon");
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
          result.current.setNetwork(POLYGON);
        });
      }).not.toThrow();
      expect(result.current.network.id).toBe("polygon");
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
          result.current.setNetwork(POLYGON);
        });
      }).not.toThrow();
    });
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
