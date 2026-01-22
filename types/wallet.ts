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
  sessionToken?: string;
  isVerified?: boolean;
  isExecuting?: boolean;
  isConnecting?: boolean;
  isVerifying?: boolean;
}

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (wallet: Wallet, address: string) => void;
}
export interface WalletContextProps {
  connectedWallet: ConnectedWallet | null;
  connectWallet: (wallet?: Wallet, address?: string, network?: string) => void;
  disconnectWallet: () => void;
  executeCall: (call: any) => Promise<any>;
  error?: string;
}

export interface WalletProviderProps {
  children: React.ReactNode;
}
