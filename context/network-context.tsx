"use client";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import type {
  NetworkContextProps,
  NetworkProviderProps,
  Network,
} from "@/types/network";

const NetworkContext = createContext<NetworkContextProps | null>(null);

export { Network };

export const NetworkProvider: FC<NetworkProviderProps> = ({ children }) => {
  const [selectedNetwork, setSelectedNetworkState] =
    useState<Network>("ethereum");

  const setSelectedNetwork = (network: Network) => {
    setSelectedNetworkState(network);
  };

  return (
    <NetworkContext.Provider value={{ selectedNetwork, setSelectedNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

export default useNetwork;
