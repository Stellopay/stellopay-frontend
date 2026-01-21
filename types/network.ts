export type Network =
  | "ethereum"
  | "starknet"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "stellar"
  | "all";

export interface NetworkContextProps {
  selectedNetwork: Network;
  setSelectedNetwork: (network: Network) => void;
}

export interface NetworkProviderProps {
  children: React.ReactNode;
}
