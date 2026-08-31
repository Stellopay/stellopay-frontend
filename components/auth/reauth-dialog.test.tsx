import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReauthDialog } from "./reauth-dialog";
import {
  AuthRecoveryProvider,
  useAuthRecovery,
} from "@/context/auth-recovery-context";
import * as authApi from "@/lib/api/auth";

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
}));

function TestContainer({ onSuccess }: { onSuccess?: () => void }) {
  const { triggerReauth, saveSessionState } = useAuthRecovery();

  React.useEffect(() => {
    saveSessionState("/settings/security", { theme: "dark" });
    triggerReauth();
  }, [saveSessionState, triggerReauth]);

  return <ReauthDialog onSuccess={onSuccess} />;
}

describe("ReauthDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders modal with preserved session information when triggered", () => {
    render(
      <AuthRecoveryProvider>
        <TestContainer />
      </AuthRecoveryProvider>
    );

    expect(screen.getByText("Session Expired")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByText("/settings/security")).toBeInTheDocument();
  });

  it("submits reauth form and invokes completeReauth on successful login", async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce();
    const onSuccess = vi.fn();

    render(
      <AuthRecoveryProvider>
        <TestContainer onSuccess={onSuccess} />
      </AuthRecoveryProvider>
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Re-authenticate/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret123",
        rememberMe: true,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("displays error message when re-authentication fails", async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(
      new authApi.AuthError("Invalid credentials provided.")
    );

    render(
      <AuthRecoveryProvider>
        <TestContainer />
      </AuthRecoveryProvider>
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "badpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Re-authenticate/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials provided.");
    });
  });
});
