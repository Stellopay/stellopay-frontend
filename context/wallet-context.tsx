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
  WalletContextProps,
  WalletProviderProps,
  ConnectedWallet,
  Wallet,
} from "@/types/wallet";

const WalletContext = createContext<WalletContextProps | null>(null);

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const [connectedWallet, setConnectedWallet] =
    useState<ConnectedWallet | null>(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("connectedWallet");
        return saved ? JSON.parse(saved) : null;
      }
      return null;
    });

  const connectWallet = (wallet: Wallet, address: string, network: string) => {
    const walletData: ConnectedWallet = { wallet, address, network };
    setConnectedWallet(walletData);
    if (typeof window !== "undefined") {
      localStorage.setItem("connectedWallet", JSON.stringify(walletData));
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("connectedWallet");
    }
  };

  return (
    <WalletContext.Provider
      value={{ connectedWallet, connectWallet, disconnectWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export default useWallet;
