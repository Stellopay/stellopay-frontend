import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ForgotPasswordForm } from "./forgot-password-form";
import { sendPasswordResetEmail, AuthError } from "@/lib/api/auth";

vi.mock("@/lib/api/auth", () => ({
  sendPasswordResetEmail: vi.fn(),
  AuthError: class AuthError extends Error {
    kind: string;
    constructor(message: string, kind: string = "invalid_credentials") {
      super(message);
      this.name = "AuthError";
      this.kind = kind;
    }
  },
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the form with email input and submit button", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send reset link/i }),
    ).toBeInTheDocument();
  });

  it("requires a valid email address", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const submitButton = screen.getByRole("button", { name: /Send reset link/i });
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);

    await user.type(emailInput, "not-an-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter a valid email address/i),
      ).toBeInTheDocument();
    });
  });

  it("shows the generic confirmation message on successful submission", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /If an account exists for this email, you will receive a password reset link shortly/i,
        ),
      ).toBeInTheDocument();
    });

    expect(sendPasswordResetEmail).toHaveBeenCalledWith("user@example.com");
  });

  it("shows identical generic confirmation message even on 4xx API response", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "unknown@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      const confirmationText = screen.getByText(
        /If an account exists for this email, you will receive a password reset link shortly/i,
      );
      expect(confirmationText).toBeInTheDocument();
    });
  });

  it("shows a network error message on server error (5xx)", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockRejectedValue(
      new AuthError("We're having trouble reaching our servers. Please try again.", "network"),
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/We're having trouble reaching our servers/i),
      ).toBeInTheDocument();
    });
  });

  it("shows a generic error message on unexpected failure", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockRejectedValue(
      new Error("Something broke"),
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/An error occurred. Please try again later/i),
      ).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(sendPasswordResetEmail).mockReturnValue(promise);

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    expect(screen.getByRole("button", { name: /Sending.../i })).toBeInTheDocument();

    resolvePromise!();
    await waitFor(() => {
      expect(
        screen.getByText(/If an account exists/i),
      ).toBeInTheDocument();
    });
  });

  it("allows the user to go back from the confirmation screen", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/If an account exists/i),
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /Back to forgot password/i });
    await user.click(backButton);

    expect(
      screen.getByRole("button", { name: /Send reset link/i }),
    ).toBeInTheDocument();
  });

  it("has accessible heading and ARIA live region on confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      const heading = screen.getByRole("heading", { name: /Check your email/i });
      expect(heading).toBeInTheDocument();
    });

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
  });

  it("disables resend button during cooldown", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      const resendButton = screen.getByRole("button", { name: /resend in/i });
      expect(resendButton).toBeDisabled();
    });
  });

  it("renders a link back to sign in", () => {
    render(<ForgotPasswordForm />);

    const signInLink = screen.getByRole("link", { name: /Back to sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute("href", "/auth/login");
  });

  it("has accessible form with email autoComplete attribute", () => {
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(emailInput).toHaveAttribute("inputmode", "email");
  });

  it("uses role=alert for error messages", async () => {
    const user = userEvent.setup();
    vi.mocked(sendPasswordResetEmail).mockRejectedValue(
      new AuthError("We're having trouble reaching our servers. Please try again.", "network"),
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const submitButton = screen.getByRole("button", { name: /Send reset link/i });

    await user.type(emailInput, "user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
