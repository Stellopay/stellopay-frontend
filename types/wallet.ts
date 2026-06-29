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
}

/** localStorage key used to persist the user's active Stellar network. */
export const WALLET_NETWORK_STORAGE_KEY = "stellopay.wallet.network";
