import { Network } from "./network";

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  supportedNetworks: Network[];
  installUrl?: string;
}

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: Wallet) => void;
}
