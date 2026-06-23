import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VerifyEmail from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
}));

describe("VerifyEmail", () => {
  afterEach(() => {
    vi.useRealTimers();
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
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(
      screen.getByText("Verification code resent to your email."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend in 30s/i })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(
      screen.getByRole("button", { name: /resend in 29s/i }),
    ).toBeDisabled();
  });
});
