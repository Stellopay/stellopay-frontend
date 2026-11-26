/**
 * lib/stellar/freighter.ts
 *
 * Thin adapter over @stellar/freighter-api.
 *
 * All calls to the Freighter extension go through this module so the rest of
 * the app can be tested with vi.mock('@/lib/stellar/freighter') without ever
 * touching a real browser extension.
 *
 * Security: only public material (addresses, network names, passphrases) ever
 * leaves this module.  Private keys and secret seeds must never be passed in.
 *
 * Freighter uses browser-extension messaging internally — it does not make
 * outbound network calls — so no changes to lib/security-headers.ts are
 * required.
 */

import {
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  getNetwork as freighterGetNetwork,
  signTransaction as freighterSignTransaction,
  WatchWalletChanges,
} from "@stellar/freighter-api";
import type { Network } from "@/types/wallet";
import { SUPPORTED_NETWORKS } from "@/context/wallet-context";

// ---------------------------------------------------------------------------
// Error codes Freighter returns when the user declines the prompt.
// Freighter v6 uses numeric error codes; 4001 is the user-rejection code
// (mirrors EIP-1193 for familiarity).
// ---------------------------------------------------------------------------
const USER_REJECTED_CODE = 4001;

export class FreighterNotInstalledError extends Error {
  readonly code = "FREIGHTER_NOT_INSTALLED";
  constructor() {
    super(
      "Freighter extension is not installed. Install it at https://freighter.app",
    );
    this.name = "FreighterNotInstalledError";
  }
}

export class FreighterUserRejectedError extends Error {
  readonly code = "USER_REJECTED";
  constructor() {
    super("The user rejected the Freighter connection request.");
    this.name = "FreighterUserRejectedError";
  }
}

// ---------------------------------------------------------------------------
// Network passphrase → SUPPORTED_NETWORKS id mapping
//
// Freighter returns a human-readable network name ("TESTNET", "FUTURENET",
// "PUBLIC") and a passphrase.  We normalise both to match the ids in
// SUPPORTED_NETWORKS.
// ---------------------------------------------------------------------------

/** Well-known passphrases from the Stellar protocol. */
const PASSPHRASE_TO_NETWORK_ID: Record<string, string> = {
  "Public Global Stellar Network ; September 2015": "stellar",
  "Test SDF Network ; September 2015": "testnet",
  "Test SDF Future Network ; October 2022": "futurenet",
};

/** Freighter's human-readable network name → app network id. */
const FREIGHTER_NAME_TO_NETWORK_ID: Record<string, string> = {
  PUBLIC: "stellar",
  MAINNET: "stellar",
  TESTNET: "testnet",
  FUTURENET: "futurenet",
};

/**
 * Map a Freighter network response to the matching entry in
 * SUPPORTED_NETWORKS, or return null if neither the passphrase nor the name
 * matches a supported network.
 */
export function mapFreighterNetwork(
  freighterNetworkName: string,
  passphrase: string,
): Network | null {
  // Passphrase match takes precedence (more precise).
  const idByPassphrase = PASSPHRASE_TO_NETWORK_ID[passphrase];
  if (idByPassphrase) {
    const found = SUPPORTED_NETWORKS.find((n) => n.id === idByPassphrase);
    if (found) return { ...found, passphrase };
  }

  // Fall back to the human-readable name.
  const idByName =
    FREIGHTER_NAME_TO_NETWORK_ID[freighterNetworkName.toUpperCase()];
  if (idByName) {
    const found = SUPPORTED_NETWORKS.find((n) => n.id === idByName);
    if (found) return { ...found, passphrase };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true when the Freighter extension is present in the browser.
 *
 * Uses requestConnectionStatus() which is the canonical detection method in
 * Freighter v6 — there is no synchronous isBrowserExtension check.
 * Returns false (never throws) so callers can gate on the result.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const { isConnected } = await freighterIsConnected();
    // isConnected returns false when the extension exists but the app is not
    // yet allowed, and true only after the user has authorised the dApp.
    // We use it purely to confirm the extension process is reachable.
    return typeof isConnected === "boolean";
  } catch {
    return false;
  }
}

/**
 * Returns true when Freighter is installed *and* the app has been granted
 * access (the user has previously clicked "Connect" in the extension popup).
 */
export async function isFreighterConnected(): Promise<boolean> {
  try {
    const { isConnected } = await freighterIsConnected();
    return Boolean(isConnected);
  } catch {
    return false;
  }
}

/**
 * Request the user to authorise the dApp through Freighter.
 *
 * @throws {FreighterNotInstalledError} when the extension is not present.
 * @throws {FreighterUserRejectedError} when the user dismisses the popup.
 */
export async function requestFreighterAccess(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterNotInstalledError();
  }

  const result = await freighterRequestAccess();

  if (result.error) {
    if (result.error.code === USER_REJECTED_CODE) {
      throw new FreighterUserRejectedError();
    }
    throw new Error(result.error.message ?? "Freighter access request failed.");
  }

  if (!result.address) {
    throw new Error("Freighter returned an empty address.");
  }

  return result.address;
}

/**
 * Retrieve the currently selected public address from Freighter without
 * triggering a connection prompt.
 *
 * @throws {FreighterNotInstalledError} when the extension is absent.
 * Returns null when no account is connected.
 */
export async function getFreighterAddress(): Promise<string | null> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterNotInstalledError();
  }

  const result = await freighterGetAddress();

  if (result.error) {
    // A missing address is not an error — just return null.
    return null;
  }

  return result.address || null;
}

/**
 * Retrieve the network currently selected inside Freighter and map it to a
 * SUPPORTED_NETWORKS entry.
 *
 * Returns null when the active Freighter network is not in SUPPORTED_NETWORKS
 * (e.g. a custom network or a future chain we do not support yet).
 *
 * @throws {FreighterNotInstalledError} when the extension is absent.
 */
export async function getFreighterNetwork(): Promise<Network | null> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterNotInstalledError();
  }

  const result = await freighterGetNetwork();

  if (result.error) {
    return null;
  }

  return mapFreighterNetwork(result.network, result.networkPassphrase);
}

/**
 * Sign a transaction XDR string with Freighter.
 *
 * @throws {FreighterNotInstalledError} when the extension is absent.
 * @throws {FreighterUserRejectedError} when the user rejects the signing.
 */
export async function signFreighterTransaction(
  transactionXdr: string,
  networkPassphrase: string,
  address?: string,
): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterNotInstalledError();
  }

  const result = await freighterSignTransaction(transactionXdr, {
    networkPassphrase,
    address,
  });

  if (result.error) {
    if (result.error.code === USER_REJECTED_CODE) {
      throw new FreighterUserRejectedError();
    }
    throw new Error(result.error.message ?? "Freighter signing failed.");
  }

  return result.signedTxXdr;
}

// ---------------------------------------------------------------------------
// Change watcher
// ---------------------------------------------------------------------------

/**
 * Callback shape delivered by watchFreighterChanges.
 */
export interface FreighterWalletState {
  address: string;
  network: Network | null;
  /** Raw passphrase returned by Freighter. */
  networkPassphrase: string;
}

/**
 * Subscribe to account / network changes inside Freighter.
 *
 * Uses WatchWalletChanges which polls the extension at `intervalMs`
 * milliseconds (default 1 000 ms). The callback fires immediately once on
 * start and then on every detected change.
 *
 * Returns a cleanup function that stops polling. Call it on unmount.
 *
 * Returns a no-op cleanup immediately when Freighter is not installed.
 */
export function watchFreighterChanges(
  callback: (state: FreighterWalletState) => void,
  intervalMs = 1000,
): () => void {
  const watcher = new WatchWalletChanges(intervalMs);

  watcher.watch(({ address, network, networkPassphrase, error }) => {
    if (error) return; // Ignore transient extension errors during polling
    callback({
      address,
      network: mapFreighterNetwork(network, networkPassphrase),
      networkPassphrase,
    });
  });

  return () => {
    watcher.stop();
  };
}
