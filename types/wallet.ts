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
  icon?: React.ReactNode;
  /**
   * Stellar network passphrase used to sign transactions and select the
   * correct Horizon/RPC endpoint. Optional for backward compatibility with
   * older test fixtures and call sites.
   */
  passphrase?: string;
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
  // Switch the active network and persist the choice.
  setNetwork: (network: Network) => void;
  // Simulate a wallet connection by populating a synthetic Stellar address.
  // A real wallet integration replaces the body of this function without
  // changing the public contract.
  connect: (address?: string) => void;
  disconnect: () => void;
}

export interface WalletProviderProps {
  children: React.ReactNode;
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
}

/** localStorage key used to persist the user's active Stellar network. */
export const WALLET_NETWORK_STORAGE_KEY = "stellopay.wallet.network";
