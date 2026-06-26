/**
 * wallet-context — unit tests
 *
 * Covers:
 * - SUPPORTED_NETWORKS contains exactly Stellar Mainnet/Testnet/Futurenet
 * - No EVM chain ids or names appear anywhere in the allow-list
 * - DEFAULT_NETWORK is Mainnet (the safe production default)
 * - WalletProvider exposes the default network when localStorage is empty
 * - Valid persisted network ids are restored on hydration
 * - Stale EVM ids ("eth", "polygon", "bsc", "arbitrum") fall back to default
 * - Arbitrary unknown ids fall back to default
 * - setActiveNetwork switches the active network and writes to localStorage
 * - setActiveNetwork rejects ids not on the allow-list (no-op)
 * - localStorage unavailability does not crash the provider
 * - useWallet throws outside a WalletProvider
 */

import { render, screen, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_NETWORK,
  SUPPORTED_NETWORKS,
  WalletProvider,
  useWallet,
} from "./wallet-context";
import { WALLET_NETWORK_STORAGE_KEY } from "@/types/wallet";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Renders a consumer that exposes the context value through data-testids. */
function WalletConsumer() {
  const { activeNetwork, setActiveNetwork, supportedNetworks } = useWallet();
  return (
    <div>
      <span data-testid="active-id">{activeNetwork.id}</span>
      <span data-testid="active-name">{activeNetwork.name}</span>
      <span data-testid="active-passphrase">{activeNetwork.passphrase}</span>
      <span data-testid="network-count">{supportedNetworks.length}</span>
      {supportedNetworks.map((n) => (
        <span key={n.id} data-testid={`network-${n.id}`}>
          {n.name}
        </span>
      ))}
      <button
        onClick={() =>
          setActiveNetwork({ id: "testnet", name: "Testnet", passphrase: "Test SDF Network ; September 2015" })
        }
        data-testid="switch-testnet"
      >
        Switch to Testnet
      </button>
      <button
        onClick={() =>
          setActiveNetwork({ id: "futurenet", name: "Futurenet", passphrase: "Test SDF Future Network ; October 2022" })
        }
        data-testid="switch-futurenet"
      >
        Switch to Futurenet
      </button>
      <button
        onClick={() =>
          setActiveNetwork({ id: "eth", name: "Ethereum", passphrase: "" })
        }
        data-testid="switch-eth"
      >
        Try switch to ETH (invalid)
      </button>
    </div>
  );
}

function renderWithProvider(initialStorageValue?: string | null) {
  if (initialStorageValue !== undefined) {
    if (initialStorageValue === null) {
      localStorage.removeItem(WALLET_NETWORK_STORAGE_KEY);
    } else {
      localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, initialStorageValue);
    }
  }
  return render(
    <WalletProvider>
      <WalletConsumer />
    </WalletProvider>,
  );
}

// ─── setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ─── SUPPORTED_NETWORKS shape ────────────────────────────────────────────────

describe("SUPPORTED_NETWORKS", () => {
  it("contains exactly three networks", () => {
    expect(SUPPORTED_NETWORKS).toHaveLength(3);
  });

  it("includes Mainnet, Testnet, and Futurenet", () => {
    const ids = SUPPORTED_NETWORKS.map((n) => n.id);
    expect(ids).toContain("public");
    expect(ids).toContain("testnet");
    expect(ids).toContain("futurenet");
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

  it("each network has a non-empty passphrase", () => {
    for (const network of SUPPORTED_NETWORKS) {
      expect(network.passphrase.length).toBeGreaterThan(0);
    }
  });

  it("passphrases do not look like private keys (64 hex chars)", () => {
    for (const network of SUPPORTED_NETWORKS) {
      expect(network.passphrase).not.toMatch(/^[0-9a-fA-F]{64}$/);
    }
  });
});

// ─── DEFAULT_NETWORK ─────────────────────────────────────────────────────────

describe("DEFAULT_NETWORK", () => {
  it("is Mainnet (id: public)", () => {
    expect(DEFAULT_NETWORK.id).toBe("public");
    expect(DEFAULT_NETWORK.name).toBe("Mainnet");
  });

  it("is the first entry in SUPPORTED_NETWORKS", () => {
    expect(DEFAULT_NETWORK).toEqual(SUPPORTED_NETWORKS[0]);
  });
});

// ─── WalletProvider default state ────────────────────────────────────────────

describe("WalletProvider — default state", () => {
  it("starts with Mainnet when localStorage is empty", async () => {
    renderWithProvider(null);
    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("public");
    });
  });

  it("exposes all three supported networks", async () => {
    renderWithProvider(null);
    await waitFor(() => {
      expect(screen.getByTestId("network-count").textContent).toBe("3");
    });
    expect(screen.getByTestId("network-public")).toBeInTheDocument();
    expect(screen.getByTestId("network-testnet")).toBeInTheDocument();
    expect(screen.getByTestId("network-futurenet")).toBeInTheDocument();
  });
});

// ─── Persisted network hydration ─────────────────────────────────────────────

describe("WalletProvider — valid persisted network", () => {
  it("restores testnet when stellopay.wallet.network=testnet", async () => {
    renderWithProvider("testnet");
    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("testnet");
    });
  });

  it("restores futurenet when stellopay.wallet.network=futurenet", async () => {
    renderWithProvider("futurenet");
    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("futurenet");
    });
  });

  it("restores public (mainnet) when stellopay.wallet.network=public", async () => {
    renderWithProvider("public");
    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("public");
    });
  });
});

// ─── Stale / invalid persisted values fall back to default ───────────────────

describe("WalletProvider — stale EVM network ids fall back to default", () => {
  for (const staleId of ["eth", "polygon", "bsc", "arbitrum", "ethereum"]) {
    it(`"${staleId}" falls back to Mainnet`, async () => {
      renderWithProvider(staleId);
      await waitFor(() => {
        expect(screen.getByTestId("active-id").textContent).toBe("public");
        expect(screen.getByTestId("active-name").textContent).toBe("Mainnet");
      });
    });
  }
});

describe("WalletProvider — arbitrary unknown ids fall back to default", () => {
  for (const unknown of ["", "solana", "bnb", "avax", "TESTNET", "Public"]) {
    it(`"${unknown}" falls back to Mainnet`, async () => {
      renderWithProvider(unknown || null);
      await waitFor(() => {
        expect(screen.getByTestId("active-id").textContent).toBe("public");
      });
    });
  }
});

// ─── setActiveNetwork ────────────────────────────────────────────────────────

describe("WalletProvider — setActiveNetwork", () => {
  it("switches to Testnet and persists the id", async () => {
    renderWithProvider(null);
    await waitFor(() =>
      expect(screen.getByTestId("active-id").textContent).toBe("public"),
    );

    act(() => {
      screen.getByTestId("switch-testnet").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("testnet");
    });
    expect(localStorage.getItem(WALLET_NETWORK_STORAGE_KEY)).toBe("testnet");
  });

  it("switches to Futurenet and persists the id", async () => {
    renderWithProvider(null);
    await waitFor(() =>
      expect(screen.getByTestId("active-id").textContent).toBe("public"),
    );

    act(() => {
      screen.getByTestId("switch-futurenet").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("futurenet");
    });
    expect(localStorage.getItem(WALLET_NETWORK_STORAGE_KEY)).toBe("futurenet");
  });

  it("is a no-op when the supplied network id is not on the allow-list", async () => {
    renderWithProvider(null);
    await waitFor(() =>
      expect(screen.getByTestId("active-id").textContent).toBe("public"),
    );

    act(() => {
      screen.getByTestId("switch-eth").click();
    });

    // State must remain unchanged
    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("public");
    });
    // Nothing written to storage
    expect(localStorage.getItem(WALLET_NETWORK_STORAGE_KEY)).toBeNull();
  });
});

// ─── localStorage availability ────────────────────────────────────────────────

describe("WalletProvider — localStorage resilience", () => {
  it("does not crash when localStorage.getItem throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    expect(() =>
      render(
        <WalletProvider>
          <WalletConsumer />
        </WalletProvider>,
      ),
    ).not.toThrow();

    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("public");
    });
  });

  it("does not crash when localStorage.setItem throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });

    renderWithProvider(null);
    await waitFor(() =>
      expect(screen.getByTestId("active-id").textContent).toBe("public"),
    );

    expect(() =>
      act(() => {
        screen.getByTestId("switch-testnet").click();
      }),
    ).not.toThrow();

    // State is still updated in memory even though storage write failed
    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe("testnet");
    });
  });
});

// ─── useWallet outside provider ───────────────────────────────────────────────

describe("useWallet", () => {
  it("throws a descriptive error when used outside WalletProvider", () => {
    // Suppress expected React error boundary output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Orphan() {
      useWallet();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      "useWallet must be used within a WalletProvider",
    );

    consoleSpy.mockRestore();
  });
});
