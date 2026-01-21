import { Network } from "./network";

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  supportedNetworks: Network[];
  installUrl?: string;
}

export interface ConnectedWallet {
  wallet: Wallet;
  address: string;
  network: string;
}

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (wallet: Wallet, address: string) => void;
}

export interface WalletContextProps {
  connectedWallet: ConnectedWallet | null;
  connectWallet: (wallet: Wallet, address: string, network: string) => void;
  disconnectWallet: () => void;
}

export interface WalletProviderProps {
  children: React.ReactNode;
}
