"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  setAuthFailureHandler,
  setTokens,
  resetRecoveryState,
  AuthExpiredError,
  TokenState,
} from "@/lib/api/authRecovery";

export type AuthRecoveryStatus = "authenticated" | "refreshing" | "unauthenticated" | "reauth_required";

export interface SavedSessionState {
  route: string;
  formState: Record<string, unknown> | null;
}

export interface AuthRecoveryContextValue {
  authStatus: AuthRecoveryStatus;
  isReauthDialogOpen: boolean;
  savedSessionState: SavedSessionState | null;
  saveSessionState: (route?: string, formState?: Record<string, unknown>) => void;
  restoreSessionState: () => SavedSessionState | null;
  completeReauth: (tokens?: TokenState) => void;
  clearSessionState: () => void;
  triggerReauth: () => void;
}

const AuthRecoveryContext = createContext<AuthRecoveryContextValue | null>(null);

export interface AuthRecoveryProviderProps {
  children: React.ReactNode;
}

export const AuthRecoveryProvider: React.FC<AuthRecoveryProviderProps> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthRecoveryStatus>("authenticated");
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);
  const [savedSessionState, setSavedSessionState] = useState<SavedSessionState | null>(null);

  const saveSessionState = useCallback((route?: string, formState?: Record<string, unknown>) => {
    const currentRoute = route || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
    const stateToSave: SavedSessionState = {
      route: currentRoute,
      formState: formState || null,
    };
    setSavedSessionState(stateToSave);
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem("stellopay_reauth_session", JSON.stringify(stateToSave));
      } catch {
        // Handle storage quota or serialization error safely
      }
    }
  }, []);

  const triggerReauth = useCallback(() => {
    saveSessionState();
    setAuthStatus("reauth_required");
    setIsReauthDialogOpen(true);
  }, [saveSessionState]);

  useEffect(() => {
    const unsubscribe = setAuthFailureHandler((_error: AuthExpiredError) => {
      triggerReauth();
    });

    return () => {
      unsubscribe();
    };
  }, [triggerReauth]);

  const restoreSessionState = useCallback((): SavedSessionState | null => {
    if (savedSessionState) {
      return savedSessionState;
    }
    if (typeof sessionStorage !== "undefined") {
      try {
        const stored = sessionStorage.getItem("stellopay_reauth_session");
        if (stored) {
          return JSON.parse(stored) as SavedSessionState;
        }
      } catch {
        return null;
      }
    }
    return null;
  }, [savedSessionState]);

  const clearSessionState = useCallback(() => {
    setSavedSessionState(null);
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.removeItem("stellopay_reauth_session");
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const completeReauth = useCallback((tokens?: TokenState) => {
    if (tokens) {
      setTokens(tokens);
    }
    setAuthStatus("authenticated");
    setIsReauthDialogOpen(false);
  }, []);

  return (
    <AuthRecoveryContext.Provider
      value={{
        authStatus,
        isReauthDialogOpen,
        savedSessionState,
        saveSessionState,
        restoreSessionState,
        completeReauth,
        clearSessionState,
        triggerReauth,
      }}
    >
      {children}
    </AuthRecoveryContext.Provider>
  );
};

export function useAuthRecovery(): AuthRecoveryContextValue {
  const context = useContext(AuthRecoveryContext);
  if (!context) {
    throw new Error("useAuthRecovery must be used within an AuthRecoveryProvider");
  }
  return context;
}
