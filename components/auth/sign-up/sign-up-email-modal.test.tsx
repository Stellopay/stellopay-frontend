import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpEmailModal } from "./sign-up-email-modal";

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onContinue: vi.fn(),
  onGoBack: vi.fn(),
  email: "user@example.com",
};

describe("SignUpEmailModal resend cooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("disables the resend button and shows a countdown during cooldown", async () => {
    render(<SignUpEmailModal {...baseProps} />);

    const resendButton = screen.getByRole("button", { name: /resend/i });
    expect(resendButton).toBeEnabled();

    fireEvent.click(resendButton);

    // "Sending…" while the (mocked) request is in flight.
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    // Resolve the resend request, which starts the 30s cooldown.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

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
    render(<SignUpEmailModal {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /resend/i }));

    // Let the mocked resend request resolve and the 30s cooldown start.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
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

  it("does not let a second click restart the cooldown while it is already active", async () => {
    render(<SignUpEmailModal {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /resend/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Advance partway through the cooldown, then try to click again.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    const coolingButton = screen.getByRole("button", {
      name: /resend in 20s/i,
    });
    fireEvent.click(coolingButton);

    // Disabled buttons don't fire onClick, so the countdown keeps
    // counting down from where it was rather than restarting at 30.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.getByRole("button", { name: /resend in 19s/i }),
    ).toBeDisabled();
  });
});
