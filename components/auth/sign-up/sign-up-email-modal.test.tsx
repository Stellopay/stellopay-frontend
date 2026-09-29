import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpEmailModal } from "./sign-up-email-modal";
import { resendVerificationEmail } from "@/lib/api/auth";

vi.mock("@/lib/api/auth", () => ({
  resendVerificationEmail: vi.fn(),
}));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onContinue: vi.fn(),
  onGoBack: vi.fn(),
  email: "user@example.com",
};

describe("SignUpEmailModal resend cooldown and api integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(resendVerificationEmail).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("disables the resend button and shows a countdown during cooldown on successful resend", async () => {
    let resolveResend: () => void = () => {};
    vi.mocked(resendVerificationEmail).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveResend = resolve;
        }),
    );

    render(<SignUpEmailModal {...baseProps} />);

    const resendButton = screen.getByRole("button", { name: /resend/i });
    expect(resendButton).toBeEnabled();

    fireEvent.click(resendButton);

    expect(resendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(resendVerificationEmail).toHaveBeenCalledWith("user@example.com");

    // "Sending…" while the request is in flight.
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    // Resolve the resend request, which starts the 30s cooldown and displays success feedback.
    await act(async () => {
      resolveResend();
    });

    expect(
      screen.getByText("Verification email resent successfully."),
    ).toBeInTheDocument();

    const coolingButton = screen.getByRole("button", {
      name: /resend in 30s/i,
    });
    expect(coolingButton).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.getByRole("button", { name: /resend in 29s/i }),
    ).toBeDisabled();
  });

  it("re-enables the resend button automatically once the cooldown elapses", async () => {
    vi.mocked(resendVerificationEmail).mockResolvedValueOnce(undefined);

    render(<SignUpEmailModal {...baseProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /resend/i }));
    });

    expect(
      screen.getByRole("button", { name: /resend in 30s/i }),
    ).toBeDisabled();

    // Run out the remainder of the cooldown.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    const resendButton = screen.getByRole("button", { name: /^resend$/i });
    expect(resendButton).toBeEnabled();
  });

  it("surfaces server error feedback and does not start cooldown when resend fails", async () => {
    vi.mocked(resendVerificationEmail).mockRejectedValueOnce(
      new Error("Failed to resend verification email. Please try again."),
    );

    render(<SignUpEmailModal {...baseProps} />);

    const resendButton = screen.getByRole("button", { name: /resend/i });
    await act(async () => {
      fireEvent.click(resendButton);
    });

    expect(resendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("Failed to resend verification email. Please try again."),
    ).toBeInTheDocument();

    // Button should be re-enabled for another attempt, not locked in countdown
    const retryButton = screen.getByRole("button", { name: /^resend$/i });
    expect(retryButton).toBeEnabled();
  });

  it("does not let repeated presses issue requests while cooldown is active", async () => {
    vi.mocked(resendVerificationEmail).mockResolvedValue(undefined);

    render(<SignUpEmailModal {...baseProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /resend/i }));
    });

    expect(resendVerificationEmail).toHaveBeenCalledTimes(1);

    // Advance partway through the cooldown, then try to click again.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    const coolingButton = screen.getByRole("button", {
      name: /resend in 20s/i,
    });
    fireEvent.click(coolingButton);

    // Still called only once
    expect(resendVerificationEmail).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.getByRole("button", { name: /resend in 19s/i }),
    ).toBeDisabled();
  });

  it("issues resend request with corrected email when typo suggestion was accepted", async () => {
    vi.mocked(resendVerificationEmail).mockResolvedValueOnce(undefined);

    render(<SignUpEmailModal {...baseProps} email="user@gmial.com" />);

    // Fix the typo
    const fixButton = screen.getByRole("button", {
      name: /change email to user@gmail.com/i,
    });
    fireEvent.click(fixButton);

    // Click resend
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /resend/i }));
    });

    expect(resendVerificationEmail).toHaveBeenCalledWith("user@gmail.com");
  });
});

describe("SignUpEmailModal typo suggestion", () => {
  it("shows a suggestion for common email typos", () => {
    render(<SignUpEmailModal {...baseProps} email="user@gmial.com" />);

    // Should show the suggestion
    expect(screen.getByText(/Did you mean/i)).toBeInTheDocument();
    expect(screen.getByText("user@gmail.com")).toBeInTheDocument();
  });

  it("does not show a suggestion for a valid email", () => {
    render(<SignUpEmailModal {...baseProps} email="user@gmail.com" />);

    expect(screen.queryByText(/Did you mean/i)).not.toBeInTheDocument();
  });

  it("updates the displayed email when the user accepts the suggestion", () => {
    render(<SignUpEmailModal {...baseProps} email="test@yahooo.com" />);

    const suggestionText = screen.getByText("test@yahoo.com");
    expect(suggestionText).toBeInTheDocument();

    const fixButton = screen.getByRole("button", {
      name: /change email to test@yahoo.com/i,
    });
    fireEvent.click(fixButton);

    // The suggestion box should disappear
    expect(screen.queryByText(/Did you mean/i)).not.toBeInTheDocument();

    // The main dialog description should now show the corrected email
    expect(screen.getByText("test@yahoo.com")).toBeInTheDocument();
  });
});

