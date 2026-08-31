import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VerifyEmail from "./page";

const mocks = vi.hoisted(() => ({
  mockGet: vi.fn().mockReturnValue(null),
  MockVerifyEmailError: class extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
      this.name = "VerifyEmailError";
    }
  },
  mockVerifyEmailToken: vi.fn(),
  mockResendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
  useSearchParams: () => ({ get: mocks.mockGet }),
}));

vi.mock("@/lib/api/auth", () => ({
  VerifyEmailError: mocks.MockVerifyEmailError,
  verifyEmailToken: mocks.mockVerifyEmailToken,
  resendVerificationEmail: mocks.mockResendVerificationEmail,
}));

describe("VerifyEmail", () => {
  afterEach(() => {
    vi.useRealTimers();
    mocks.mockGet.mockReturnValue(null);
    mocks.mockVerifyEmailToken.mockReset();
    mocks.mockResendVerificationEmail.mockReset();
    mocks.mockResendVerificationEmail.mockResolvedValue(undefined);
  });

  it("keeps continue disabled until the 6-character code is complete", () => {
    render(<VerifyEmail />);

    const continueButton = screen.getByRole("button", { name: /continue/i });
    expect(continueButton).toBeDisabled();

    for (let index = 1; index <= 6; index += 1) {
      fireEvent.change(
        screen.getByLabelText(`Verification code character ${index}`),
        { target: { value: String(index) } },
      );
    }

    expect(continueButton).toBeEnabled();
  });

  it("supports pasting a complete verification code", () => {
    render(<VerifyEmail />);

    fireEvent.paste(screen.getByLabelText("Verification code character 1"), {
      clipboardData: { getData: () => "123456" },
    });

    expect(screen.getByLabelText("Verification code character 6")).toHaveValue(
      "6",
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("starts a resend cooldown after resending the code", async () => {
    vi.useFakeTimers();
    render(<VerifyEmail />);

    fireEvent.click(screen.getByRole("button", { name: /^resend$/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(
      screen.getByText("Verification code resent to your email."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /resend in 30s/i }),
    ).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(
      screen.getByRole("button", { name: /resend in 29s/i }),
    ).toBeDisabled();
  });

  describe("token verification", () => {
    afterEach(() => {
      mocks.mockGet.mockReturnValue(null);
    });

    it("shows loading then success when token is valid", async () => {
      mocks.mockVerifyEmailToken.mockResolvedValue(undefined);
      mocks.mockGet.mockImplementation(
        (key: string) => (key === "token" ? "valid-token" : null),
      );

      render(<VerifyEmail />);

      expect(screen.getByText("Verifying your email...")).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByText("Your email has been verified successfully."),
        ).toBeInTheDocument();
      });

      expect(mocks.mockVerifyEmailToken).toHaveBeenCalledWith("valid-token");
    });

    it("shows specific message with resend action when token is expired", async () => {
      mocks.mockVerifyEmailToken.mockRejectedValue(
        new mocks.MockVerifyEmailError(
          "This verification link has expired.",
          "TOKEN_EXPIRED",
        ),
      );
      mocks.mockGet.mockImplementation(
        (key: string) => (key === "token" ? "expired-token" : null),
      );

      render(<VerifyEmail />);

      await waitFor(() => {
        expect(screen.getByText("Link expired")).toBeInTheDocument();
        expect(
          screen.getByText("This verification link has expired."),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /request new verification email/i,
          }),
        ).toBeInTheDocument();
      });
    });

    it("shows specific message with resend action when token is invalid", async () => {
      mocks.mockVerifyEmailToken.mockRejectedValue(
        new mocks.MockVerifyEmailError(
          "This verification link is invalid.",
          "TOKEN_INVALID",
        ),
      );
      mocks.mockGet.mockImplementation(
        (key: string) => (key === "token" ? "invalid-token" : null),
      );

      render(<VerifyEmail />);

      await waitFor(() => {
        expect(screen.getByText("Link invalid")).toBeInTheDocument();
        expect(
          screen.getByText("This verification link is invalid."),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /request new verification email/i,
          }),
        ).toBeInTheDocument();
      });
    });

    it("shows generic error for verification failure (non-token errors)", async () => {
      mocks.mockVerifyEmailToken.mockRejectedValue(
        new mocks.MockVerifyEmailError("Verification failed.", "VERIFICATION_FAILED"),
      );
      mocks.mockGet.mockImplementation(
        (key: string) => (key === "token" ? "bad-token" : null),
      );

      render(<VerifyEmail />);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(
          screen.getByText("Verification failed."),
        ).toBeInTheDocument();
      });
    });

    it("shows generic error for network failures", async () => {
      mocks.mockVerifyEmailToken.mockRejectedValue(new Error("Network error"));
      mocks.mockGet.mockImplementation(
        (key: string) => (key === "token" ? "network-fail" : null),
      );

      render(<VerifyEmail />);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(
          screen.getByText(
            "An error occurred during verification. Please try again later.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("resend button on expired screen calls resendVerificationEmail", async () => {
      mocks.mockVerifyEmailToken.mockRejectedValue(
        new mocks.MockVerifyEmailError(
          "This verification link has expired.",
          "TOKEN_EXPIRED",
        ),
      );
      mocks.mockResendVerificationEmail.mockResolvedValue(undefined);
      mocks.mockGet.mockImplementation(
        (key: string) =>
          key === "token" ? "expired-token" : key === "email" ? "user@test.com" : null,
      );

      render(<VerifyEmail />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /request new verification email/i,
          }),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", { name: /request new verification email/i }),
      );

      await waitFor(() => {
        expect(mocks.mockResendVerificationEmail).toHaveBeenCalledWith(
          "user@test.com",
        );
        expect(
          screen.getByText("Verification email sent! Check your inbox."),
        ).toBeInTheDocument();
      });
    });

    it("does not call verifyEmailToken when no token param is present", () => {
      mocks.mockGet.mockReturnValue(null);

      render(<VerifyEmail />);

      expect(mocks.mockVerifyEmailToken).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: /check your email/i }),
      ).toBeInTheDocument();
    });
  });
});
