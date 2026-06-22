import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

import AccountSection from "./account-section";

const getEmailInput = () => screen.getByLabelText("Email address");
const getSaveButton = () =>
  screen.getByRole("button", { name: /save account changes/i });

describe("AccountSection email validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the default demo email valid and Save enabled", () => {
    render(<AccountSection />);

    expect(getEmailInput()).toHaveValue("user@example.com");
    expect(getSaveButton()).not.toBeDisabled();
  });

  it("shows an inline error and aria-invalid when the email is malformed on blur", () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "user@" } });
    fireEvent.blur(emailInput);

    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText(/enter a valid email address/i),
    ).toBeInTheDocument();
  });

  it("does not show an error before the field has been touched", () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "user@" } });

    expect(emailInput).toHaveAttribute("aria-invalid", "false");
  });

  it.each([
    { label: "empty email", email: "" },
    { label: "missing TLD", email: "user@domain" },
    { label: "malformed local/domain pairing", email: "user@domain." },
  ])("disables Save for $label", ({ email }) => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.blur(emailInput);

    expect(getSaveButton()).toBeDisabled();
  });

  it("blocks save for a malformed email by disabling Save and ignoring clicks on it", async () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "user@domain" } });
    fireEvent.blur(emailInput);

    const saveButton = getSaveButton();
    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);

    expect(
      screen.queryByText(/staged and ready for backend save/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/saving\.\.\./i)).not.toBeInTheDocument();
  });

  it("trims leading and trailing whitespace before validating, treating the result as valid", () => {
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "  user@example.com  " } });
    fireEvent.blur(emailInput);

    expect(emailInput).toHaveValue("user@example.com");
    expect(emailInput).toHaveAttribute("aria-invalid", "false");
    expect(getSaveButton()).not.toBeDisabled();
  });

  it("saves successfully once a previously invalid email is corrected", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, { target: { value: "not-an-email" } });
    fireEvent.blur(emailInput);
    expect(getSaveButton()).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
    expect(getSaveButton()).not.toBeDisabled();
    fireEvent.click(getSaveButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/staged and ready for backend save/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("shows a failure status message when the simulated save rejects", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    render(<AccountSection />);

    fireEvent.click(getSaveButton());

    await waitFor(
      () =>
        expect(
          screen.getByText(/failed to save changes/i),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it("normalizes a whitespace-padded email at save time even without a prior blur", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<AccountSection />);
    const emailInput = getEmailInput();

    fireEvent.change(emailInput, {
      target: { value: "  user@example.com  " },
    });
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(emailInput).toHaveValue("user@example.com"));
  });

  it("updates the other profile fields via their onChange handlers", () => {
    render(<AccountSection />);

    fireEvent.change(screen.getByLabelText("First name"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Last name"), {
      target: { value: "Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Ada L." },
    });
    fireEvent.change(screen.getByLabelText("Timezone"), {
      target: { value: "UTC" },
    });
    fireEvent.change(screen.getByLabelText("Settlement currency"), {
      target: { value: "EUR" },
    });

    expect(screen.getByLabelText("First name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Last name")).toHaveValue("Lovelace");
    expect(screen.getByLabelText("Display name")).toHaveValue("Ada L.");
    expect(screen.getByLabelText("Timezone")).toHaveValue("UTC");
    expect(screen.getByLabelText("Settlement currency")).toHaveValue("EUR");
  });
});
