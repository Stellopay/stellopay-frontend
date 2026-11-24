/**
 * lib/stellar/freighter.test.ts
 *
 * Unit tests for the Freighter adapter.  All calls to @stellar/freighter-api
 * are mocked so no browser extension or network connection is required.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

// ── Mock @stellar/freighter-api before importing the adapter ──────────────────
vi.mock("@stellar/freighter-api", () => {
  const watchStop = vi.fn();
  const watchFn = vi.fn();
  // Must use function syntax for the mock to work as a constructor (new WatchWalletChanges()).
  function WatchWalletChanges(this: { watch: typeof watchFn; stop: typeof watchStop; isRunning: boolean }, _timeout?: number) {
    this.watch = watchFn;
    this.stop = watchStop;
    this.isRunning = false;
  }
  // Attach the shared mocks so tests can inspect them.
  (WatchWalletChanges as unknown as Record<string, unknown>).__watchFn = watchFn;
  (WatchWalletChanges as unknown as Record<string, unknown>).__stopFn = watchStop;
  return {
    isConnected: vi.fn(),
    requestAccess: vi.fn(),
    getAddress: vi.fn(),
    getNetwork: vi.fn(),
    signTransaction: vi.fn(),
    WatchWalletChanges,
  };
});

// ── Mock wallet-context to break the circular dep (adapter imports SUPPORTED_NETWORKS)
vi.mock("@/context/wallet-context", () => ({
  SUPPORTED_NETWORKS: [
    { id: "stellar", name: "Stellar" },
    { id: "testnet", name: "Testnet" },
    { id: "futurenet", name: "Futurenet" },
  ],
}));

import * as freighterApi from "@stellar/freighter-api";
import {
  isFreighterInstalled,
  isFreighterConnected,
  requestFreighterAccess,
  getFreighterAddress,
  getFreighterNetwork,
  signFreighterTransaction,
  watchFreighterChanges,
  mapFreighterNetwork,
  FreighterNotInstalledError,
  FreighterUserRejectedError,
} from "./freighter";

const mockIsConnected = freighterApi.isConnected as Mock;
const mockRequestAccess = freighterApi.requestAccess as Mock;
const mockGetAddress = freighterApi.getAddress as Mock;
const mockGetNetwork = freighterApi.getNetwork as Mock;
const mockSignTransaction = freighterApi.signTransaction as Mock;

const VALID_ADDRESS = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

// ---------------------------------------------------------------------------
// mapFreighterNetwork
// ---------------------------------------------------------------------------

describe("mapFreighterNetwork", () => {
  it("maps the mainnet passphrase to the stellar network", () => {
    const result = mapFreighterNetwork(
      "PUBLIC",
      "Public Global Stellar Network ; September 2015",
    );
    expect(result?.id).toBe("stellar");
    expect(result?.passphrase).toBe(
      "Public Global Stellar Network ; September 2015",
    );
  });

  it("maps the testnet passphrase to the testnet network", () => {
    const result = mapFreighterNetwork(
      "TESTNET",
      "Test SDF Network ; September 2015",
    );
    expect(result?.id).toBe("testnet");
  });

  it("maps the futurenet passphrase to the futurenet network", () => {
    const result = mapFreighterNetwork(
      "FUTURENET",
      "Test SDF Future Network ; October 2022",
    );
    expect(result?.id).toBe("futurenet");
  });

  it("falls back to name matching when passphrase is unknown", () => {
    const result = mapFreighterNetwork("MAINNET", "some custom passphrase");
    expect(result?.id).toBe("stellar");
  });

  it("returns null for an unsupported network", () => {
    const result = mapFreighterNetwork("CUSTOM", "Some unknown network");
    expect(result).toBeNull();
  });

  it("is case-insensitive on the network name fallback", () => {
    const result = mapFreighterNetwork("testnet", "Some unknown passphrase");
    expect(result?.id).toBe("testnet");
  });
});

// ---------------------------------------------------------------------------
// isFreighterInstalled
// ---------------------------------------------------------------------------

describe("isFreighterInstalled", () => {
  beforeEach(() => {
    mockIsConnected.mockReset();
  });

  it("returns true when isConnected resolves with a boolean", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });
    expect(await isFreighterInstalled()).toBe(true);
  });

  it("returns true when isConnected resolves with isConnected=true", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    expect(await isFreighterInstalled()).toBe(true);
  });

  it("returns false when isConnected rejects (extension not present)", async () => {
    mockIsConnected.mockRejectedValue(new Error("Extension not found"));
    expect(await isFreighterInstalled()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFreighterConnected
// ---------------------------------------------------------------------------

describe("isFreighterConnected", () => {
  beforeEach(() => {
    mockIsConnected.mockReset();
  });

  it("returns true when isConnected resolves with true", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    expect(await isFreighterConnected()).toBe(true);
  });

  it("returns false when isConnected resolves with false", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });
    expect(await isFreighterConnected()).toBe(false);
  });

  it("returns false when isConnected rejects", async () => {
    mockIsConnected.mockRejectedValue(new Error("Extension not found"));
    expect(await isFreighterConnected()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// requestFreighterAccess
// ---------------------------------------------------------------------------

describe("requestFreighterAccess", () => {
  beforeEach(() => {
    mockIsConnected.mockReset();
    mockRequestAccess.mockReset();
    // Default: extension is installed
    mockIsConnected.mockResolvedValue({ isConnected: false });
  });

  it("returns the address on success", async () => {
    mockRequestAccess.mockResolvedValue({ address: VALID_ADDRESS });
    const address = await requestFreighterAccess();
    expect(address).toBe(VALID_ADDRESS);
  });

  it("throws FreighterNotInstalledError when extension is absent", async () => {
    mockIsConnected.mockRejectedValue(new Error("not found"));
    await expect(requestFreighterAccess()).rejects.toThrow(
      FreighterNotInstalledError,
    );
  });

  it("throws FreighterUserRejectedError when user rejects (code 4001)", async () => {
    mockRequestAccess.mockResolvedValue({
      address: "",
      error: { code: 4001, message: "User declined" },
    });
    await expect(requestFreighterAccess()).rejects.toThrow(
      FreighterUserRejectedError,
    );
  });

  it("throws a generic Error when Freighter returns a non-rejection error", async () => {
    mockRequestAccess.mockResolvedValue({
      address: "",
      error: { code: 1000, message: "Internal Freighter error" },
    });
    await expect(requestFreighterAccess()).rejects.toThrow(
      "Internal Freighter error",
    );
  });

  it("throws when Freighter returns an empty address without an error field", async () => {
    mockRequestAccess.mockResolvedValue({ address: "" });
    await expect(requestFreighterAccess()).rejects.toThrow(
      /empty address/i,
    );
  });
});

// ---------------------------------------------------------------------------
// getFreighterAddress
// ---------------------------------------------------------------------------

describe("getFreighterAddress", () => {
  beforeEach(() => {
    mockIsConnected.mockReset();
    mockGetAddress.mockReset();
    mockIsConnected.mockResolvedValue({ isConnected: false });
  });

  it("returns the address when available", async () => {
    mockGetAddress.mockResolvedValue({ address: VALID_ADDRESS });
    const result = await getFreighterAddress();
    expect(result).toBe(VALID_ADDRESS);
  });

  it("returns null when no address is connected", async () => {
    mockGetAddress.mockResolvedValue({ address: "" });
    expect(await getFreighterAddress()).toBeNull();
  });

  it("returns null when Freighter returns an error", async () => {
    mockGetAddress.mockResolvedValue({
      address: "",
      error: { code: 999, message: "not allowed" },
    });
    expect(await getFreighterAddress()).toBeNull();
  });

  it("throws FreighterNotInstalledError when extension is absent", async () => {
    mockIsConnected.mockRejectedValue(new Error("not found"));
    await expect(getFreighterAddress()).rejects.toThrow(
      FreighterNotInstalledError,
    );
  });
});

// ---------------------------------------------------------------------------
// getFreighterNetwork
// ---------------------------------------------------------------------------

describe("getFreighterNetwork", () => {
  beforeEach(() => {
    mockIsConnected.mockReset();
    mockGetNetwork.mockReset();
    mockIsConnected.mockResolvedValue({ isConnected: false });
  });

  it("returns the mapped Network for a known passphrase", async () => {
    mockGetNetwork.mockResolvedValue({
      network: "PUBLIC",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
    });
    const network = await getFreighterNetwork();
    expect(network?.id).toBe("stellar");
  });

  it("returns null for an unknown passphrase", async () => {
    mockGetNetwork.mockResolvedValue({
      network: "CUSTOM",
      networkPassphrase: "Some custom passphrase",
    });
    expect(await getFreighterNetwork()).toBeNull();
  });

  it("returns null when Freighter returns an error", async () => {
    mockGetNetwork.mockResolvedValue({
      network: "",
      networkPassphrase: "",
      error: { code: 999, message: "denied" },
    });
    expect(await getFreighterNetwork()).toBeNull();
  });

  it("throws FreighterNotInstalledError when extension is absent", async () => {
    mockIsConnected.mockRejectedValue(new Error("not found"));
    await expect(getFreighterNetwork()).rejects.toThrow(
      FreighterNotInstalledError,
    );
  });
});

// ---------------------------------------------------------------------------
// signFreighterTransaction
// ---------------------------------------------------------------------------

describe("signFreighterTransaction", () => {
  beforeEach(() => {
    mockIsConnected.mockReset();
    mockSignTransaction.mockReset();
    mockIsConnected.mockResolvedValue({ isConnected: false });
  });

  it("returns the signed XDR on success", async () => {
    mockSignTransaction.mockResolvedValue({
      signedTxXdr: "AAAAASIGNEDXDR==",
      signerAddress: VALID_ADDRESS,
    });
    const result = await signFreighterTransaction(
      "AAAATX==",
      "Public Global Stellar Network ; September 2015",
    );
    expect(result).toBe("AAAAASIGNEDXDR==");
  });

  it("throws FreighterNotInstalledError when extension is absent", async () => {
    mockIsConnected.mockRejectedValue(new Error("not found"));
    await expect(
      signFreighterTransaction("AAAATX==", "Public Global Stellar Network ; September 2015"),
    ).rejects.toThrow(FreighterNotInstalledError);
  });

  it("throws FreighterUserRejectedError when user rejects signing", async () => {
    mockSignTransaction.mockResolvedValue({
      signedTxXdr: "",
      signerAddress: "",
      error: { code: 4001, message: "User declined" },
    });
    await expect(
      signFreighterTransaction("AAAATX==", "Public Global Stellar Network ; September 2015"),
    ).rejects.toThrow(FreighterUserRejectedError);
  });

  it("throws a generic error on other signing failures", async () => {
    mockSignTransaction.mockResolvedValue({
      signedTxXdr: "",
      signerAddress: "",
      error: { code: 500, message: "Internal error" },
    });
    await expect(
      signFreighterTransaction("AAAATX==", "Public Global Stellar Network ; September 2015"),
    ).rejects.toThrow("Internal error");
  });
});

// ---------------------------------------------------------------------------
// watchFreighterChanges
// ---------------------------------------------------------------------------

describe("watchFreighterChanges", () => {
  let sharedWatchFn: ReturnType<typeof vi.fn>;
  let sharedStopFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const W = freighterApi.WatchWalletChanges as unknown as Record<string, unknown>;
    sharedWatchFn = W.__watchFn as ReturnType<typeof vi.fn>;
    sharedStopFn = W.__stopFn as ReturnType<typeof vi.fn>;
    sharedWatchFn.mockReset();
    sharedStopFn.mockReset();
  });

  it("creates a WatchWalletChanges instance with the given interval", () => {
    const cb = vi.fn();
    watchFreighterChanges(cb, 2000);
    // The constructor sets up the instance — just verify watch was called.
    expect(sharedWatchFn).toHaveBeenCalled();
  });

  it("calls watch() on the watcher instance", () => {
    const cb = vi.fn();
    watchFreighterChanges(cb);
    expect(sharedWatchFn).toHaveBeenCalledOnce();
  });

  it("returns a stop function that calls stop() on the watcher", () => {
    const cb = vi.fn();
    const stop = watchFreighterChanges(cb);
    stop();
    expect(sharedStopFn).toHaveBeenCalled();
  });

  it("fires the callback with a mapped network when watch delivers a change", () => {
    const cb = vi.fn();
    watchFreighterChanges(cb);

    // Simulate the watcher calling its inner callback
    const watchCb = sharedWatchFn.mock.calls[0][0];
    watchCb({
      address: VALID_ADDRESS,
      network: "PUBLIC",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
    });

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        address: VALID_ADDRESS,
        network: expect.objectContaining({ id: "stellar" }),
      }),
    );
  });

  it("does not fire the callback when the watcher reports an error", () => {
    const cb = vi.fn();
    watchFreighterChanges(cb);

    const watchCb = sharedWatchFn.mock.calls[0][0];
    watchCb({
      address: "",
      network: "",
      networkPassphrase: "",
      error: { code: 500, message: "Polling error" },
    });

    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error class shapes
// ---------------------------------------------------------------------------

describe("FreighterNotInstalledError", () => {
  it("has the correct name and code", () => {
    const err = new FreighterNotInstalledError();
    expect(err.name).toBe("FreighterNotInstalledError");
    expect(err.code).toBe("FREIGHTER_NOT_INSTALLED");
    expect(err.message).toMatch(/freighter\.app/i);
  });
});

describe("FreighterUserRejectedError", () => {
  it("has the correct name and code", () => {
    const err = new FreighterUserRejectedError();
    expect(err.name).toBe("FreighterUserRejectedError");
    expect(err.code).toBe("USER_REJECTED");
  });
});
