"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";
import { connect } from "@starknet-io/get-starknet";
import { getBackendBaseUrl } from "@/lib/backend";

type WalletLike = {
  selectedAddress?: string;
  account?: {
    address?: string;
    signMessage?: (typedData: unknown) => Promise<unknown>;
    execute?: (calls: any) => Promise<any>;
  };
  enable?: () => Promise<void> | void;
  disconnect?: () => Promise<void> | void;
};

type WalletContextValue = {
  address: string | null;
  sessionToken: string | null;
  isVerified: boolean;
  isConnecting: boolean;
  isExecuting: boolean;
  isVerifying: boolean;
  isInitializing: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  executeCall: (call: any) => Promise<{ transaction_hash?: string }>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY_ADDRESS = "stellopay_wallet_address";
const STORAGE_KEY_SESSION = "stellopay_session_token";

async function postJson<TResponse>(
  url: string,
  body: unknown,
): Promise<TResponse> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // Network / CORS failures show up as TypeError with messages like "fetch failed"/"Failed to fetch".
    throw new Error(
      `Backend unreachable. Tried ${url}. Check that backend is running and CORS allows this origin.`,
    );
  }

  const parsed = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      parsed?.error ?? `Request failed (${res.status} ${res.statusText || "Error"})`;
    // Don't mislabel backend-provided errors as "unreachable"
    throw new Error(msg);
  }
  return parsed as TResponse;
}

function toFeltHex(value: unknown): string {
  if (typeof value === "string") {
    if (value.startsWith("0x") || value.startsWith("0X")) return value;
    try {
      return `0x${BigInt(value).toString(16)}`;
    } catch {
      return value;
    }
  }
  if (typeof value === "number") return `0x${BigInt(value).toString(16)}`;
  if (typeof value === "bigint") return `0x${value.toString(16)}`;
  // best-effort fallback
  return String(value);
}

function normalizeSignature(sig: unknown): string[] {
  if (Array.isArray(sig) && sig.length >= 2) {
    return sig.map(toFeltHex);
  }
  if (sig && typeof sig === "object") {
    const anySig = sig as any;
    if (Array.isArray(anySig.signature) && anySig.signature.length >= 2) {
      return anySig.signature.map(toFeltHex);
    }
    if (anySig.r !== undefined && anySig.s !== undefined) {
      return [toFeltHex(anySig.r), toFeltHex(anySig.s)];
    }
  }
  throw new Error("Unexpected signature format from wallet");
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const walletRef = useRef<WalletLike | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to perform verification flow (challenge + sign + verify)
  const performVerification = useCallback(
    async (wallet: WalletLike, walletAddress: string) => {
      const apiBase = getBackendBaseUrl();
      try {
        // Step 1: get challenge from backend
        const challenge = await postJson<{ typed_data: unknown }>(`${apiBase}/auth/challenge`, {
          address: walletAddress,
        });

        // Step 2: wallet signs typed data challenge
        const signMessage = wallet.account?.signMessage;
        if (typeof signMessage !== "function") {
          throw new Error("Connected wallet does not support message signing");
        }
        const sigRaw = await signMessage(challenge.typed_data);
        const signature = normalizeSignature(sigRaw);

        // Step 3: backend verifies signature and issues session token
        const verify = await postJson<{ session_token: string }>(`${apiBase}/auth/verify`, {
          address: walletAddress,
          signature,
        });

        setSessionToken(verify.session_token);
        setIsVerified(true);

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_ADDRESS, walletAddress);
          localStorage.setItem(STORAGE_KEY_SESSION, verify.session_token);
        }
      } catch (e) {
        console.error("[wallet] Auto-verification failed:", e);
        setSessionToken(null);
        setIsVerified(false);
        throw e;
      }
    },
    [],
  );

  useEffect(() => {
    // Restore previous session token (best-effort) so API calls can work after refresh.
    // Wallet connection itself still depends on the user wallet extension.
    if (typeof window === "undefined") {
      setIsInitializing(false);
      return;
    }

    const savedAddress = localStorage.getItem(STORAGE_KEY_ADDRESS);
    const savedToken = localStorage.getItem(STORAGE_KEY_SESSION);

    if (savedAddress) setAddress(savedAddress);

    // Helper to attempt auto-verification
    const attemptAutoVerification = async () => {
      setIsVerifying(true);
      try {
        // Wait a bit for wallet extension to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const starknet = await connect();
        if (!starknet) {
          console.log("[wallet] No wallet extension found for auto-verification");
          setIsVerifying(false);
          setIsInitializing(false);
          return;
        }
        
        const wallet = starknet as unknown as WalletLike;
        const currentAddress = wallet.selectedAddress ?? wallet.account?.address ?? savedAddress;
        
        if (!currentAddress) {
          console.log("[wallet] Wallet connected but no address available");
          setIsVerifying(false);
          setIsInitializing(false);
          return;
        }
        
        if (savedAddress && currentAddress.toLowerCase() !== savedAddress.toLowerCase()) {
          console.log("[wallet] Wallet address changed, skipping auto-verification");
          setIsVerifying(false);
          setIsInitializing(false);
          return;
        }
        
        // Wallet is connected with the same address -> auto-verify
        walletRef.current = wallet;
        if (savedAddress) setAddress(savedAddress);
        
        const enablePromise =
          typeof wallet.enable === "function" ? wallet.enable() : Promise.resolve();
        await Promise.resolve(enablePromise);
        
        await performVerification(wallet, currentAddress);
        console.log("[wallet] Auto-verification successful");
      } catch (e) {
        console.error("[wallet] Auto-verification failed:", e);
        // Don't throw - let user manually reconnect if needed
      } finally {
        setIsVerifying(false);
        setIsInitializing(false);
      }
    };

    if (savedAddress && savedToken) {
      // Validate with backend (backend sessions are in-memory and can be lost on restart)
      const apiBase = getBackendBaseUrl();
      void postJson<{ ok: boolean }>(`${apiBase}/auth/session/validate`, {
        address: savedAddress,
        session_token: savedToken,
      })
        .then(() => {
          setSessionToken(savedToken);
          setIsVerified(true);
          console.log("[wallet] Session validated successfully");
          setIsInitializing(false);
        })
        .catch((err) => {
          console.log("[wallet] Session validation failed, attempting auto-verification:", err);
          // Session expired/invalid -> try to auto-reconnect if wallet is still connected
          localStorage.removeItem(STORAGE_KEY_SESSION);
          setSessionToken(null);
          setIsVerified(false);

          // Attempt auto-verification
          void attemptAutoVerification();
        });
    } else if (savedAddress && !savedToken) {
      // We have an address but no session token -> check if wallet is still connected and auto-verify
      console.log("[wallet] Address found but no session token, attempting auto-verification");
      void attemptAutoVerification();
    } else {
      // No saved address or token - initialization complete
      setIsInitializing(false);
    }
  }, [performVerification]);

  const connectWallet = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const starknet = await connect();
      if (!starknet) {
        setIsConnecting(false);
        return;
      }

      const wallet = starknet as unknown as WalletLike;
      if (typeof wallet.enable === "function") {
        await wallet.enable();
      }

      walletRef.current = wallet;
      const nextAddress = wallet.selectedAddress ?? wallet.account?.address ?? null;
      setAddress(nextAddress);

      if (!nextAddress) {
        throw new Error("Wallet connected but no address was provided");
      }

      await performVerification(wallet, nextAddress);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
      setIsVerified(false);
      setSessionToken(null);
    } finally {
      setIsConnecting(false);
    }
  }, [performVerification]);

  const disconnectWallet = useCallback(async () => {
    setError(null);
    try {
      const wallet = walletRef.current;
      if (wallet && typeof wallet.disconnect === "function") {
        await wallet.disconnect();
      }
    } finally {
      walletRef.current = null;
      setAddress(null);
      setSessionToken(null);
      setIsVerified(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_ADDRESS);
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    }
  }, []);

  const executeCall = useCallback(async (call: any) => {
    // Ensure wallet is connected and ready
    let wallet = walletRef.current;
    if (!wallet) {
      // Try to reconnect if wallet ref is null
      try {
        const starknet = await connect();
        if (starknet) {
          const walletLike = starknet as unknown as WalletLike;
          if (typeof walletLike.enable === "function") {
            await walletLike.enable();
          }
          walletRef.current = walletLike;
          wallet = walletLike;
        }
      } catch (e) {
        console.error("[executeCall] Failed to reconnect wallet:", e);
      }
    }
    
    if (!wallet) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }
    
    const exec = wallet.account?.execute;
    if (typeof exec !== "function") {
      // Try to get account from wallet if not available
      if (!wallet.account) {
        throw new Error("Wallet account not available. Please reconnect your wallet.");
      }
      throw new Error("Connected wallet does not support execute(). Please use a compatible wallet.");
    }
    
    setError(null);
    setIsExecuting(true);
    try {
      const calls = Array.isArray(call) ? call : [call];
      const result = await exec(calls);
      return result ?? {};
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Transaction failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      sessionToken,
      isVerified,
      isConnecting,
      isExecuting,
      isVerifying,
      isInitializing,
      error,
      connectWallet,
      disconnectWallet,
      executeCall,
    }),
    [
      address,
      sessionToken,
      isVerified,
      isConnecting,
      isExecuting,
      isVerifying,
      isInitializing,
      error,
      connectWallet,
      disconnectWallet,
      executeCall,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}


