"use client";

// WalletProvider is the single source of truth for the connected wallet and
// the active network. The navbar, NetworkSwitcher, dashboard address, and
// future transaction surfaces all read from this provider via useWallet.
//
// Security: only the public Stellar G-address and the network id are ever
// held in state or written to localStorage. Secret keys are never accepted
// by connect() and never logged.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Network,
  WalletContextValue,
  WalletProviderProps,
} from "@/types/wallet";

// Networks exposed to the UI. Stellar is the only network the product is
// actually built on, so it is the sole supported entry. The placeholder EVM
// chains (ETH, Polygon, BSC, Arbitrum) were removed because they had no real
// adapters behind them — they will be added back here once genuine multichain
// support lands.
export const SUPPORTED_NETWORKS: Network[] = [
  { id: "stellar", name: "Stellar" },
];

export const DEFAULT_NETWORK: Network = SUPPORTED_NETWORKS[0];

// Legacy storage key kept for backward compatibility with older tests and
// any call sites that imported it from this module before the rename.
export const WALLET_NETWORK_STORAGE_KEY = "stellopay.wallet.network";

const STORAGE_KEY_NETWORK = WALLET_NETWORK_STORAGE_KEY;

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

// Synthetic Stellar-style address used by the demo connect flow. Real wallet
// integrations will replace this with the address returned by the signer.
const SYNTHETIC_ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";

// Best-effort, SSR-safe localStorage read. Mirrors the pattern in
// context/theme-context.tsx and context/sidebar-context.tsx: never assume
// window or storage exists, and swallow any access error so the provider
// still renders in restricted environments (private mode, iframes).
function readNetworkFromStorage(): Network | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== "function") return null;
    const id = storage.getItem(STORAGE_KEY_NETWORK);
    if (!id) return null;
    return SUPPORTED_NETWORKS.find((n) => n.id === id) ?? null;
  } catch {
    return null;
  }
}

function writeNetworkToStorage(network: Network): void {
  if (typeof window === "undefined") return;
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.setItem !== "function") return;
    storage.setItem(STORAGE_KEY_NETWORK, network.id);
  } catch {
    // Storage may be unavailable in restricted contexts. The provider
    // still functions in memory, just without persistence.
  }
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  initialAddress = null,
  initialNetwork,
}) => {
  const [address, setAddress] = useState<string | null>(initialAddress);
  const [network, setNetworkState] = useState<Network>(
    initialNetwork ?? DEFAULT_NETWORK,
  );

  // Hydrate the network on the client. Running this in an effect (rather than
  // in useState's initializer) keeps server and first client render in sync,
  // avoiding the React hydration mismatch warning.
  useEffect(() => {
    if (initialNetwork) return;
    const stored = readNetworkFromStorage();
    if (stored && stored.id !== network.id) {
      setNetworkState(stored);
    }
  }, [initialNetwork, network.id]);

  const setNetwork = useCallback((next: Network) => {
    setNetworkState(next);
    writeNetworkToStorage(next);
  }, []);

  const connect = useCallback((next?: string) => {
    // Refuse anything that looks like a Stellar secret key. Secrets start
    // with S followed by 55 base32 characters. This is defense in depth in
    // case a caller misuses the public API.
    if (next && /^S[A-Z2-7]{55}$/.test(next)) {
      throw new Error(
        "WalletProvider.connect rejected a value that looks like a Stellar secret key. Pass a public G-address instead.",
      );
    }
    setAddress(next ?? SYNTHETIC_ADDRESS);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected: address !== null,
      network,
      setNetwork,
      connect,
      disconnect,
    }),
    [address, network, setNetwork, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

// Read the wallet context. Throws a clear error when called outside of a
// WalletProvider, which is the contract the issue calls out explicitly.
export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error(
      "useWallet must be used within a WalletProvider. Wrap the tree in <WalletProvider> (see app/layout.tsx).",
    );
  }
  return ctx;
}

// Truncate a Stellar address for display: GABC...F123. Kept here so every
// consumer formats it the same way without sprinkling slicing logic across
// the tree.
export function formatAddress(address: string | null): string {
  if (!address) return "";
  if (address.length <= 9) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
