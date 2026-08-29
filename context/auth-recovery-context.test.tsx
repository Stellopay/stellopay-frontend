import React from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AuthRecoveryProvider,
  useAuthRecovery,
} from "./auth-recovery-context";
import {
  requestTokenRefresh,
  setCustomRefreshHandler,
  resetRecoveryState,
  AuthExpiredError,
} from "@/lib/api/authRecovery";

describe("AuthRecoveryContext", () => {
  beforeEach(() => {
    resetRecoveryState();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("provides initial authenticated status", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthRecoveryProvider>{children}</AuthRecoveryProvider>
    );

    const { result } = renderHook(() => useAuthRecovery(), { wrapper });

    expect(result.current.authStatus).toBe("authenticated");
    expect(result.current.isReauthDialogOpen).toBe(false);
  });

  it("saves and restores route and safe form state", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthRecoveryProvider>{children}</AuthRecoveryProvider>
    );

    const { result } = renderHook(() => useAuthRecovery(), { wrapper });

    const formInputs = { username: "alice", amount: "250" };

    act(() => {
      result.current.saveSessionState("/checkout?step=2", formInputs);
    });

    const restored = result.current.restoreSessionState();
    expect(restored?.route).toBe("/checkout?step=2");
    expect(restored?.formState).toEqual(formInputs);
  });

  it("automatically triggers reauth dialog when non-recoverable token failure occurs", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthRecoveryProvider>{children}</AuthRecoveryProvider>
    );

    const { result } = renderHook(() => useAuthRecovery(), { wrapper });

    setCustomRefreshHandler(async () => {
      throw new Error("Invalid refresh token");
    });

    await act(async () => {
      try {
        await requestTokenRefresh();
      } catch (err) {
        expect(err).toBeInstanceOf(AuthExpiredError);
      }
    });

    expect(result.current.authStatus).toBe("reauth_required");
    expect(result.current.isReauthDialogOpen).toBe(true);
  });

  it("resumes authenticated state when completeReauth is called", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthRecoveryProvider>{children}</AuthRecoveryProvider>
    );

    const { result } = renderHook(() => useAuthRecovery(), { wrapper });

    act(() => {
      result.current.triggerReauth();
    });
    expect(result.current.authStatus).toBe("reauth_required");

    act(() => {
      result.current.completeReauth({ accessToken: "new-token" });
    });

    expect(result.current.authStatus).toBe("authenticated");
    expect(result.current.isReauthDialogOpen).toBe(false);
  });
});
