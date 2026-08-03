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
  WalletConnectionResult,
  WalletContextValue,
  WalletProviderProps,
} from "@/types/wallet";
import { isWalletAddress, isWalletConnectionResult } from "@/types/wallet";
import type { WatchlistItem } from "@/types/watchlist";

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
const SYNTHETIC_ADDRESS =
  "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

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

// ─── Watchlist persistence helpers ───────────────────────────────────────────

/**
 * Returns the localStorage key used to persist the watchlist for the given
 * account address. Using a per-address key means each connected account gets
 * its own independent watchlist.
 */
function watchlistStorageKey(address: string): string {
  return `stellopay.watchlist.${address}`;
}

/**
 * Read the persisted watchlist for a given account address.
 * Returns an empty array if none is found or the stored value is malformed.
 */
function readWatchlistFromStorage(address: string | null): WatchlistItem[] {
  if (!address || typeof window === "undefined") return [];
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== "function") return [];
    const raw = storage.getItem(watchlistStorageKey(address));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic structural guard: each entry must have an id and address string.
    return parsed.filter(
      (item): item is WatchlistItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as WatchlistItem).id === "string" &&
        typeof (item as WatchlistItem).address === "string" &&
        typeof (item as WatchlistItem).pinnedAt === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Persist the watchlist for a given account address to localStorage.
 * Silently swallows quota or access errors.
 */
function writeWatchlistToStorage(
  address: string | null,
  items: WatchlistItem[],
): void {
  if (!address || typeof window === "undefined") return;
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.setItem !== "function") return;
    storage.setItem(watchlistStorageKey(address), JSON.stringify(items));
  } catch {
    // Storage unavailable — watchlist still works in memory for the session.
  }
}

// ─── Watchlist context ────────────────────────────────────────────────────────

export interface WatchlistContextValue {
  items: WatchlistItem[];
  isLoading: boolean;
  /**
   * Pin a new address or asset to the watchlist.
   * Duplicate addresses (case-insensitive) are silently ignored.
   */
  addItem: (address: string, label?: string) => void;
  /** Remove a pinned item by its stable id. */
  removeItem: (id: string) => void;
  /** Update mutable fields (label, balance, lastActivity …) for an item. */
  updateItem: (id: string, patch: Partial<Omit<WatchlistItem, "id" | "pinnedAt">>) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | undefined>(
  undefined,
);

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  initialAddress = null,
  initialNetwork,
  subscribeToNetworkChanges,
}) => {
  const [address, setAddress] = useState<string | null>(initialAddress);
  const [network, setNetworkState] = useState<Network>(
    initialNetwork ?? DEFAULT_NETWORK,
  );
  const [isUnsupportedNetwork, setIsUnsupportedNetwork] = useState(false);

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

  // Subscribe to external provider network-change events (e.g. Freighter,
  // WalletConnect).  When the wallet SDK reports a new network id we:
  //   1. Look it up in SUPPORTED_NETWORKS.
  //   2a. If found — update context state and persist, clear any prior
  //       unsupported-network warning.
  //   2b. If not found — set isUnsupportedNetwork=true so the UI can warn
  //       the user without silently continuing on the wrong chain.
  //
  // Security note: this closes the gap where a user could be mid-transaction
  // on the wrong network because the app didn't detect the provider switch.
  useEffect(() => {
    if (!subscribeToNetworkChanges) return;

    const cleanup = subscribeToNetworkChanges((networkId: string) => {
      const matched = SUPPORTED_NETWORKS.find((n) => n.id === networkId);
      if (matched) {
        setNetworkState(matched);
        writeNetworkToStorage(matched);
        setIsUnsupportedNetwork(false);
      } else {
        // Surface an unsupported-network warning without clearing the last
        // known-good network — components can still read the previous value
        // as context for an error message.
        setIsUnsupportedNetwork(true);
      }
    });

    return () => {
      cleanup?.();
    };
  }, [subscribeToNetworkChanges]);

  const setNetwork = useCallback((next: Network) => {
    const supported = SUPPORTED_NETWORKS.some((n) => n.id === next.id);
    setNetworkState(next);
    setIsUnsupportedNetwork(!supported);
    if (supported) {
      writeNetworkToStorage(next);
    }
  }, []);

  const connect = useCallback((next?: string | WalletConnectionResult) => {
    if (next === undefined) {
      setAddress(SYNTHETIC_ADDRESS);
      return;
    }

    // Refuse anything that looks like a Stellar secret key. Secrets start
    // with S followed by 55 base32 characters. This is defense in depth in
    // case a caller misuses the public API.
    if (typeof next === "string" && /^S[A-Z2-7]+$/.test(next.trim())) {
      throw new Error(
        "WalletProvider.connect rejected a value that looks like a Stellar secret key. Pass a public G-address instead.",
      );
    }

    if (typeof next === "string") {
      if (!isWalletAddress(next)) {
        throw new Error(
          "WalletProvider.connect rejected an invalid Stellar public address.",
        );
      }
      setAddress(next.trim());
      return;
    }

    if (!isWalletConnectionResult(next)) {
      throw new Error(
        "WalletProvider.connect rejected an invalid wallet connection payload.",
      );
    }

    setAddress(next.address.trim());
    if (next.network) {
      setNetwork(next.network);
    }
  }, [setNetwork]);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected: address !== null,
      network,
      isUnsupportedNetwork,
      setNetwork,
      connect,
      disconnect,
    }),
    [address, network, isUnsupportedNetwork, setNetwork, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

// ─── WatchlistProvider ────────────────────────────────────────────────────────

/**
 * Provides watchlist state (pinned items) scoped to the currently-connected
 * wallet address.  Wrap this *inside* WalletProvider so it can read the
 * active address and load the right per-account storage key.
 *
 * In the app layout both providers are composed as:
 *   <WalletProvider>
 *     <WatchlistProvider>
 *       …app…
 *     </WatchlistProvider>
 *   </WalletProvider>
 */
export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address } = useWallet();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Re-hydrate whenever the connected address changes.
  useEffect(() => {
    setIsLoading(true);
    const stored = readWatchlistFromStorage(address);
    setItems(stored);
    setIsLoading(false);
  }, [address]);

  const addItem = useCallback(
    (addr: string, label?: string) => {
      setItems((prev) => {
        // Deduplicate by address (case-insensitive).
        const alreadyPinned = prev.some(
          (item) => item.address.toLowerCase() === addr.toLowerCase(),
        );
        if (alreadyPinned) return prev;
        const newItem: WatchlistItem = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          address: addr,
          label,
          pinnedAt: new Date().toISOString(),
        };
        const next = [...prev, newItem];
        writeWatchlistToStorage(address, next);
        return next;
      });
    },
    [address],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        writeWatchlistToStorage(address, next);
        return next;
      });
    },
    [address],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<WatchlistItem, "id" | "pinnedAt">>) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
        writeWatchlistToStorage(address, next);
        return next;
      });
    },
    [address],
  );

  const value = useMemo<WatchlistContextValue>(
    () => ({ items, isLoading, addItem, removeItem, updateItem }),
    [items, isLoading, addItem, removeItem, updateItem],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
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

/**
 * Read the watchlist context. Throws a clear error when called outside of a
 * WatchlistProvider.
 */
export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error(
      "useWatchlist must be used within a WatchlistProvider. Wrap the tree in <WatchlistProvider> (see app/layout.tsx).",
    );
  }
  return ctx;
}
