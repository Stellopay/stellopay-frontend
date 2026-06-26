"use client";

/**
 * WalletContext
 *
 * Provides the active Stellar network to the component tree and persists
 * the user's selection to localStorage under {@link WALLET_NETWORK_STORAGE_KEY}.
 *
 * Security: the persisted id is validated against {@link SUPPORTED_NETWORKS}
 * on every hydration. A stale EVM id (e.g. "eth", "polygon") or any unknown
 * value silently falls back to {@link DEFAULT_NETWORK} rather than crashing
 * or surfacing an invalid network to the UI.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FC,
  type ReactNode,
} from "react";
import {
  DEFAULT_NETWORK,
  SUPPORTED_NETWORKS,
  WALLET_NETWORK_STORAGE_KEY,
  type Network,
} from "@/types/wallet";

export type { Network };
export { SUPPORTED_NETWORKS, DEFAULT_NETWORK };

interface WalletContextValue {
  /** The currently active Stellar network. */
  activeNetwork: Network;
  /** Switch to a different Stellar network and persist the selection. */
  setActiveNetwork: (network: Network) => void;
  /** Ordered list of all Stellar networks the app supports. */
  supportedNetworks: readonly Network[];
}

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Map a raw localStorage string to a known network.
 * Returns {@link DEFAULT_NETWORK} for any unrecognised or null value —
 * this guards against stale EVM ids left over from a previous build.
 */
function resolvePersistedNetwork(raw: string | null): Network {
  if (!raw) return DEFAULT_NETWORK;
  return SUPPORTED_NETWORKS.find((n) => n.id === raw) ?? DEFAULT_NETWORK;
}

/**
 * Wrap the component tree with `WalletProvider` to make
 * {@link useWallet} available to all descendants.
 */
export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeNetwork, setActiveNetworkState] =
    useState<Network>(DEFAULT_NETWORK);

  // Hydrate from localStorage on the client; validate against the allow-list.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(WALLET_NETWORK_STORAGE_KEY);
      setActiveNetworkState(resolvePersistedNetwork(raw));
    } catch {
      // localStorage unavailable (e.g. storage blocked in private browsing) — keep default.
    }
  }, []);

  const setActiveNetwork = useCallback((network: Network) => {
    // Accept only networks present in the allow-list.
    const validated = SUPPORTED_NETWORKS.find((n) => n.id === network.id);
    if (!validated) return;
    setActiveNetworkState(validated);
    try {
      localStorage.setItem(WALLET_NETWORK_STORAGE_KEY, validated.id);
    } catch {
      // Storage write failure is non-fatal — state is still updated in memory.
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        activeNetwork,
        setActiveNetwork,
        supportedNetworks: SUPPORTED_NETWORKS,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Access the active Stellar network and the network-switcher function.
 *
 * @throws If called outside a {@link WalletProvider}.
 */
export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
