import type { ReactNode } from "react";

// Wallet and network model used by WalletProvider.
// Addresses follow Stellar's G-prefixed format. Only public material is
// ever stored or logged. Secrets must never reach this layer.

/**
 * A Stellar network the app can connect to.
 */
export interface Network {
  /** Stable machine-readable identifier, e.g. `"stellar"`, `"testnet"`. */
  id: string;
  /** Human-readable label shown in the UI, e.g. `"Stellar"`. */
  name: string;
  /**
   * Optional React node icon for the network, shown in the NetworkSwitcher.
   * Falls back to the StellarIcon SVG when not provided.
   */
  icon?: ReactNode;
  /**
   * Stellar network passphrase used to sign transactions and select the
   * correct Horizon/RPC endpoint. Optional for backward compatibility with
   * older test fixtures and call sites.
   */
  passphrase?: string;
}

export interface WalletCapabilities {
  canSignTransaction: boolean;
  canSignMessage: boolean;
  canSwitchNetwork: boolean;
}

export type WalletActionName =
  | "signTransaction"
  | "signMessage"
  | "switchNetwork";

export interface WalletActionState {
  enabled: boolean;
  reason: string;
  alternative: string;
}

export interface WalletContextValue {
  // Public Stellar G-address of the currently connected account, or null
  // when no wallet is connected.
  address: string | null;
  isConnected: boolean;
  network: Network;
  /**
   * True when the wallet provider has reported a network that is not in
   * SUPPORTED_NETWORKS.  Components should surface a warning (e.g. the
   * NetworkSwitcher unsupported-network banner) when this is true rather
   * than silently continuing with potentially wrong chain data.
   */
  isUnsupportedNetwork: boolean;
  /**
   * Current provider capability matrix. The values are calculated from:
   * - whether a wallet is connected,
   * - whether the active network is supported, and
   * - the wallet provider's advertised capabilities.
   */
  capabilities: WalletCapabilities;
  /**
   * Back-compat alias for the same capability matrix exposed under the older
   * wallet-capability naming pattern in issue tests.
   */
  walletCapabilities: WalletCapabilities;
  /**
   * Returns the UI-ready disabled/enabled state for an action with a
   * recovery message and alternative-path guidance.
   */
  getActionState: (action: WalletActionName) => WalletActionState;
  // Switch the active network and persist the choice.
  setNetwork: (network: Network) => void;
  // Simulate a wallet connection by populating a synthetic Stellar address.
  // A real wallet integration replaces the body of this function without
  // changing the public contract.
  connect: (payload?: string | WalletConnectionResult) => void;
  disconnect: () => void;
}

export interface WalletProviderProps {
  children: ReactNode;
  // Optional seed for tests and SSR. When omitted, the provider starts
  // disconnected and hydrates the network from localStorage on mount.
  initialAddress?: string | null;
  initialNetwork?: Network;
  /**
   * Optional external network-change event subscription hook.
   *
   * Real wallet SDKs (e.g. Freighter, WalletConnect) emit network-change
   * events outside React's control.  Pass a function that subscribes to
   * those events and calls `onNetworkChanged` with the new network id.
   * The provider calls `subscribe` on mount and the returned cleanup
   * function on unmount, mirroring the useEffect cleanup pattern.
   *
   * Example (Freighter):
   * ```tsx
   * <WalletProvider
   *   subscribeToNetworkChanges={(onNetworkChanged) => {
   *     const unsub = freighter.on("networkChanged", (id) => onNetworkChanged(id));
   *     return unsub;
   *   }}
   * >
   * ```
   *
   * When omitted (the default), no external subscription is set up and
   * network state can only change through `setNetwork`.
   */
  subscribeToNetworkChanges?: (
    onNetworkChanged: (networkId: string) => void,
  ) => (() => void) | void;
  /**
   * Optional provider capability flags advertised by the wallet integration.
   * These are evaluated alongside the app's connection and network state to
   * decide whether actions should be disabled before prompting the wallet.
   */
  providerCapabilities?: Partial<WalletCapabilities>;
  /**
   * Optional external account-change subscription hook used to keep capability
   * state in sync when a wallet reconnects or switches addresses.
   */
  subscribeToAccountChanges?: (
    onAccountChanged: (address: string | null) => void,
  ) => (() => void) | void;
}

/**
 * Payload returned by a wallet connect flow before it is committed to context.
 */
export interface WalletConnectionResult {
  /** Public Stellar G-address returned by the wallet provider. */
  address: string;
  /**
   * Optional active network reported by the wallet provider. When omitted,
   * WalletProvider keeps the current/default network.
   */
  network?: Network;
}

/** localStorage key used to persist the user's active Stellar network. */
export const WALLET_NETWORK_STORAGE_KEY = "stellopay.wallet.network";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Runtime guard for Stellar public addresses accepted by wallet connect data.
 */
export function isWalletAddress(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return /^G[A-Z2-7]{55}$/.test(normalized);
}

/**
 * Runtime guard for the serializable portion of a wallet network.
 */
export function isNetwork(value: unknown): value is Network {
  if (!isRecord(value)) return false;

  const { id, name, passphrase } = value;
  return (
    typeof id === "string" &&
    id.trim().length > 0 &&
    typeof name === "string" &&
    name.trim().length > 0 &&
    (passphrase === undefined || typeof passphrase === "string")
  );
}

/**
 * Runtime guard for data returned by a wallet connect flow.
 */
export function isWalletConnectionResult(
  value: unknown,
): value is WalletConnectionResult {
  if (!isRecord(value)) return false;

  return (
    isWalletAddress(value.address) &&
    (value.network === undefined || isNetwork(value.network))
  );
}
