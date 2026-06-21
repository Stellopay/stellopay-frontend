import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AccountSection from "./account-section";

describe("AccountSection", () => {
  it("blocks saving and marks the email field invalid for malformed emails", () => {
    render(<AccountSection />);

    const emailInput = screen.getByLabelText("Email address");
    fireEvent.change(emailInput, { target: { value: "user@" } });
    fireEvent.blur(emailInput);

    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save account changes" }),
    ).toBeDisabled();
  });

  it("enables saving when whitespace is trimmed to a valid email", () => {
    render(<AccountSection />);

    const emailInput = screen.getByLabelText("Email address");
    fireEvent.change(emailInput, {
      target: { value: " user@example.com " },
    });
    fireEvent.blur(emailInput);

    expect(emailInput).toHaveAttribute("aria-invalid", "false");
    expect(
      screen.getByRole("button", { name: "Save account changes" }),
    ).toBeEnabled();
  });
});
