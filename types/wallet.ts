// Wallet and network model used by WalletProvider.
// Addresses follow Stellar's G-prefixed format. Only public material is
// ever stored or logged. Secrets must never reach this layer.

export interface Network {
  id: string;
  name: string;
  passphrase?: string;
  icon?: React.ReactNode;
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
