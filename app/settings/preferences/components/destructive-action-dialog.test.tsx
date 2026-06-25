import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DestructiveActionDialog from "./destructive-action-dialog";

/**
 * Renders the dialog with sensible defaults and immediately opens it, returning
 * the `onConfirm` spy so individual tests can assert whether it fired.
 */
function renderOpenDialog(onConfirm = vi.fn()) {
  render(
    <DestructiveActionDialog
      triggerLabel="Deactivate account"
      title="Deactivate this account"
      description="This pauses sign-in."
      impactItems={["Wallet operations would be blocked."]}
      confirmationToken="DEACTIVATE"
      confirmationLabel='Type "DEACTIVATE" to confirm'
      confirmLabel="Confirm deactivation"
      onConfirm={onConfirm}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Deactivate account" }));
  return { onConfirm };
}

const getInput = () => screen.getByLabelText('Type "DEACTIVATE" to confirm');
const getConfirmButton = () =>
  screen.getByRole("button", { name: "Confirm deactivation" });

describe("DestructiveActionDialog", () => {
  it("auto-focuses the confirmation input and exposes its requirements", () => {
    renderOpenDialog();

    const input = getInput();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveAccessibleDescription(/type "DEACTIVATE" exactly/i);
    expect(getConfirmButton()).toBeDisabled();
  });

  it("hints at invisible whitespace when only spaces differ", () => {
    const { onConfirm } = renderOpenDialog();
    const input = getInput();

    fireEvent.change(input, { target: { value: "DEACTIVATE " } });

    expect(input).toHaveAttribute("aria-invalid", "true");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/extra spaces/i);
    expect(getConfirmButton()).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("hints at capitalization when only the casing differs", () => {
    renderOpenDialog();

    fireEvent.change(getInput(), { target: { value: "deactivate" } });

    expect(screen.getByRole("alert")).toHaveTextContent(/capitalization/i);
    expect(getConfirmButton()).toBeDisabled();
  });

  it("shows a generic mismatch error for unrelated input", () => {
    renderOpenDialog();

    fireEvent.change(getInput(), { target: { value: "nope" } });

    expect(screen.getByRole("alert")).toHaveTextContent(/doesn't match/i);
    expect(getConfirmButton()).toBeDisabled();
  });

  it("confirms only on an exact, case-correct token", () => {
    const { onConfirm } = renderOpenDialog();

    fireEvent.change(getInput(), { target: { value: "DEACTIVATE" } });

    const input = getInput();
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const confirmButton = getConfirmButton();
    expect(confirmButton).toBeEnabled();

    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
