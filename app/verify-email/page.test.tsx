import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import VerifyEmail from "@/app/verify-email/page";

// Mock next/navigation
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
}));

// Use fake timers so setTimeout-based status resets are testable
beforeEach(() => {
  vi.useFakeTimers();
  mockBack.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("VerifyEmail", () => {
  // ---------- Static / initial render ----------

  it("renders the heading, resend link, input, continue button, and go-back button", () => {
    render(<VerifyEmail />);

    expect(
      screen.getByRole("heading", { name: /check your email/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /resend/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("- - - - - - - -"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /go back/i }),
    ).toBeInTheDocument();
  });

  it("renders a close button with an accessible label", () => {
    render(<VerifyEmail />);

    expect(
      screen.getByRole("button", { name: /close/i }),
    ).toBeInTheDocument();
  });

  // ---------- Navigation ----------

  it("calls router.back when the close button is clicked", () => {
    render(<VerifyEmail />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("calls router.back when the go-back button is clicked", () => {
    render(<VerifyEmail />);

    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // ---------- Code input ----------

  it("allows entering a 6-character alphanumeric code", () => {
    render(<VerifyEmail />);

    const input = screen.getByPlaceholderText("- - - - - - - -");
    fireEvent.change(input, { target: { value: "ABC123" } });

    expect(input).toHaveValue("ABC123");
  });

  it("strips non-alphanumeric characters from input", () => {
    render(<VerifyEmail />);

    const input = screen.getByPlaceholderText("- - - - - - - -");
    fireEvent.change(input, { target: { value: "A!@#B$%^C" } });

    expect(input).toHaveValue("ABC");
  });

  it("rejects input longer than 6 characters at the state level", () => {
    render(<VerifyEmail />);

    const input = screen.getByPlaceholderText("- - - - - - - -");

    // First set a valid 6-char code
    fireEvent.change(input, { target: { value: "ABCDEF" } });
    expect(input).toHaveValue("ABCDEF");

    // Attempt to set 7 chars — component guard prevents it
    fireEvent.change(input, { target: { value: "ABCDEFG" } });
    expect(input).toHaveValue("ABCDEF");
  });

  // ---------- Continue button enablement ----------

  it("disables the continue button when code is shorter than 6 characters", () => {
    render(<VerifyEmail />);

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it("enables the continue button when exactly 6 characters are entered", () => {
    render(<VerifyEmail />);

    const input = screen.getByPlaceholderText("- - - - - - - -");
    fireEvent.change(input, { target: { value: "123456" } });

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeEnabled();
  });

  // ---------- Successful verification ----------

  it("shows success message after entering the correct code and clicking continue", async () => {
    render(<VerifyEmail />);

    const input = screen.getByPlaceholderText("- - - - - - - -");
    fireEvent.change(input, { target: { value: "123456" } });

    const continueBtn = screen.getByRole("button", { name: /continue/i });

    // Click → sets status "loading"
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    // Button shows "Verifying..." during loading
    expect(
      screen.getByRole("button", { name: /verifying/i }),
    ).toBeInTheDocument();

    // Advance past the 1500 ms simulated API delay
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent("Email verified successfully!");

    // After status resets (3 s), button returns to "Continue"
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });

  // ---------- Failed verification ----------

  it("shows error message when an incorrect code is submitted", async () => {
    render(<VerifyEmail />);

    const input = screen.getByPlaceholderText("- - - - - - - -");
    fireEvent.change(input, { target: { value: "000000" } });

    const continueBtn = screen.getByRole("button", { name: /continue/i });

    await act(async () => {
      fireEvent.click(continueBtn);
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "Invalid verification code. Please try again.",
    );

    // After status resets, button returns to "Continue"
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });

  // ---------- Resend ----------

  it("shows a success message after resending the code", async () => {
    render(<VerifyEmail />);

    const resendBtn = screen.getByRole("button", { name: /resend/i });

    await act(async () => {
      fireEvent.click(resendBtn);
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "Verification code resent to your email.",
    );

    // After status resets, button returns to "Resend"
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(
      screen.getByRole("button", { name: /resend/i }),
    ).toBeInTheDocument();
  });

  it("disables the resend button while the resend is in progress", async () => {
    render(<VerifyEmail />);

    const resendBtn = screen.getByRole("button", { name: /resend/i });

    await act(async () => {
      fireEvent.click(resendBtn);
    });

    expect(resendBtn).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // After success, button shows "Resend" again and is enabled
    const resendBtnAfter = screen.getByRole("button", { name: /resend/i });
    expect(resendBtnAfter).toBeEnabled();
  });

  // ---------- Continue button loading state ----------

  it("disables continue button while verification is in progress", async () => {
    render(<VerifyEmail />);

    const input = screen.getByPlaceholderText("- - - - - - - -");
    fireEvent.change(input, { target: { value: "123456" } });

    const continueBtn = screen.getByRole("button", { name: /continue/i });

    await act(async () => {
      fireEvent.click(continueBtn);
    });

    // Button shows "Verifying..." and stays disabled
    expect(
      screen.getByRole("button", { name: /verifying/i }),
    ).toBeDisabled();

    // Advance past the simulated API delay + idle reset
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // After status resets, continue button should be enabled again (code still in input)
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeEnabled();
  });
});
