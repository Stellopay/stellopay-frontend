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
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Network,
  WalletActionName,
  WalletActionState,
  WalletCapabilities,
  WalletConnectionResult,
  WalletContextValue,
  WalletProviderProps,
} from "@/types/wallet";
import { isWalletAddress, isWalletConnectionResult } from "@/types/wallet";
import { createAccountScope, realtimeRegistry } from "@/lib/realtime-registry";

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

const DEFAULT_CAPABILITIES: WalletCapabilities = {
  canSignTransaction: false,
  canSignMessage: false,
  canSwitchNetwork: false,
};

type DirtySource = () => boolean;

interface DirtyGuardContextValue {
  isDirty: () => boolean;
  registerDirtySource: (sourceId: string, isDirty: DirtySource) => () => void;
  confirmDiscard: () => boolean;
}

const DirtyGuardContext = createContext<DirtyGuardContextValue | undefined>(undefined);

const DISCARD_WARNING =
  "You have unsaved changes. Discard them and continue?";

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

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  initialAddress = null,
  initialNetwork,
  subscribeToNetworkChanges,
  subscribeToAccountChanges,
  providerCapabilities = {},
}) => {
  const [address, setAddress] = useState<string | null>(initialAddress);
  const [network, setNetworkState] = useState<Network>(
    initialNetwork ?? DEFAULT_NETWORK,
  );
  const [isUnsupportedNetwork, setIsUnsupportedNetwork] = useState(false);

  const dirtySourcesRef = useRef(new Map<string, () => boolean>());

  // Account scope of the currently active wallet context. All realtime
  // subscriptions opened by views are owned by this scope, so the provider
  // can tear them down when the account (or network) is replaced.
  const scope = createAccountScope(network.id, address);

  // Tear down realtime channels owned by the *previous* account scope before
  // the new account context takes over. React runs this cleanup (which closes
  // over the old scope) whenever the scope changes — account switch, logout,
  // network switch — and on provider unmount. Combined with the registry's
  // ownership guard, this guarantees no previous-account event can ever reach
  // a listener opened for the current account (issue #1179).
  useEffect(() => {
    return () => {
      if (scope) {
        realtimeRegistry.unsubscribeScope(scope);
      }
    };
  }, [scope]);

  const capabilities = useMemo<WalletCapabilities>(() => {
    const base = {
      ...DEFAULT_CAPABILITIES,
      ...providerCapabilities,
    };

    if (!address || address.trim().length === 0) {
      return DEFAULT_CAPABILITIES;
    }

    if (isUnsupportedNetwork) {
      return {
        canSignTransaction: false,
        canSignMessage: false,
        canSwitchNetwork: false,
      };
    }

    return {
      canSignTransaction: Boolean(base.canSignTransaction),
      canSignMessage: Boolean(base.canSignMessage),
      canSwitchNetwork: Boolean(base.canSwitchNetwork),
    };
  }, [address, isUnsupportedNetwork, providerCapabilities]);

  const getActionState = useCallback(
    (action: WalletActionName): WalletActionState => {
      if (!address) {
        return {
          enabled: false,
          reason: "Connect a compatible wallet before trying this action.",
          alternative:
            "Use a supported, compatible wallet or reconnect to a wallet that supports Stellar signing.",
        };
      }

      if (isUnsupportedNetwork) {
        const unsupportedText =
          "This wallet is on an unsupported network. Switch back to a supported Stellar network before continuing.";
        return {
          enabled: false,
          reason:
            action === "switchNetwork"
              ? unsupportedText
              : `${unsupportedText} ${action === "signTransaction" ? "Transactions cannot be signed until the network is corrected." : "Signing is unavailable until the wallet is on Stellar."}`,
          alternative:
            "Switch to Stellar or reconnect with a wallet that supports the required network configuration.",
        };
      }

      const capabilityLookup: Record<WalletActionName, boolean> = {
        signTransaction: capabilities.canSignTransaction,
        signMessage: capabilities.canSignMessage,
        switchNetwork: capabilities.canSwitchNetwork,
      };

      const enabled = capabilityLookup[action];
      const actionLabels: Record<WalletActionName, string> = {
        signTransaction: "sign transactions",
        signMessage: "sign messages",
        switchNetwork: "switch networks",
      };

      if (enabled) {
        return {
          enabled: true,
          reason: "This action is available for the connected wallet.",
          alternative: "No recovery step is required.",
        };
      }

      return {
        enabled: false,
        reason: `This wallet does not currently support ${actionLabels[action]}.`,
        alternative:
          "Try a different compatible wallet or reconnect with a provider that exposes the required capability.",
      };
    },
    [address, capabilities, isUnsupportedNetwork],
  );

  const isDirty = useCallback(() => {
    for (const source of dirtySourcesRef.current.values()) {
      if (source()) return true;
    }
    return false;
  }, []);

  const registerDirtySource = useCallback(
    (sourceId: string, isDirtySource: DirtySource) => {
      dirtySourcesRef.current.set(sourceId, isDirtySource);
      return () => {
        dirtySourcesRef.current.delete(sourceId);
      };
    },
    [],
  );

  const confirmDiscard = useCallback(() => {
    if (!isDirty()) return true;
    if (typeof window === "undefined") return true;
    return window.confirm(DISCARD_WARNING);
  }, [isDirty]);

  const dirtyGuardValue = useMemo<DirtyGuardContextValue>(
    () => ({
      isDirty,
      registerDirtySource,
      confirmDiscard,
    }),
    [isDirty, registerDirtySource, confirmDiscard],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      if (!confirmDiscard()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [confirmDiscard]);

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

  useEffect(() => {
    if (!subscribeToAccountChanges) return;

    const cleanup = subscribeToAccountChanges((nextAddress: string | null) => {
      setAddress(nextAddress);
    });

    return () => {
      cleanup?.();
    };
  }, [subscribeToAccountChanges]);

  const setNetwork = useCallback((next: Network) => {
    const supported = SUPPORTED_NETWORKS.some((n) => n.id === next.id);
    setNetworkState(next);
    setIsUnsupportedNetwork(!supported);
    if (supported) {
      writeNetworkToStorage(next);
    }
  }, []);

  const setNetwork = useCallback(
    (next: Network) => {
      if (!confirmDiscard()) return;
      applyNetwork(next);
    },
    [applyNetwork, confirmDiscard],
  );

  const connect = useCallback((next?: string | WalletConnectionResult) => {
    if (next === undefined) {
      if (!confirmDiscard()) return;
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
      if (!confirmDiscard()) return;
      setAddress(next.trim());
      return;
    }

    if (!isWalletConnectionResult(next)) {
      throw new Error(
        "WalletProvider.connect rejected an invalid wallet connection payload.",
      );
    }

    if (!confirmDiscard()) return;
    setAddress(next.address.trim());
    if (next.network) {
      applyNetwork(next.network);
    }
  }, [applyNetwork, confirmDiscard]);

  const disconnect = useCallback(() => {
    if (!confirmDiscard()) return;
    setAddress(null);
  }, [confirmDiscard]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected: address !== null,
      network,
      isUnsupportedNetwork,
      capabilities,
      walletCapabilities: capabilities,
      getActionState,
      setNetwork,
      connect,
      disconnect,
    }),
    [address, network, isUnsupportedNetwork, capabilities, getActionState, setNetwork, connect, disconnect],
  );

  return (
    <DirtyGuardContext.Provider value={dirtyGuardValue}>
      <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
    </DirtyGuardContext.Provider>
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

// Read the shared dirty-state guard. Throws when used outside of the
// WalletProvider, same contract as useWallet.
export function useDirtyGuard(): DirtyGuardContextValue {
  const ctx = useContext(DirtyGuardContext);
  if (!ctx) {
    throw new Error(
      "useDirtyGuard must be used within a WalletProvider. Wrap the tree in <WalletProvider>.",
    );
  }
  return ctx;
}

// Register a form's dirty state with the shared guard. While `isDirty` is
// true, wallet changes, route navigations, and browser unloads will warn.
// Set `isDirty` to false on successful submit to clear the guard.
export function useDirtyForm(isDirty: boolean): void {
  const { registerDirtySource } = useDirtyGuard();
  const id = useId();
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    return registerDirtySource(id, () => isDirtyRef.current);
  }, [registerDirtySource, id]);
}

// Truncate a Stellar address for display: GABC...F123. Kept here so every
// consumer formats it the same way without sprinkling slicing logic across
// the tree.
export function formatAddress(address: string | null): string {
  if (!address) return "";
  if (address.length <= 9) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
