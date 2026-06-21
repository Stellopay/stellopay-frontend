import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DestructiveActionDialog from "./destructive-action-dialog";

function renderDialog(onConfirm = vi.fn()) {
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

describe("DestructiveActionDialog", () => {
  it("focuses and describes the required confirmation input", () => {
    renderDialog();

    const input = screen.getByLabelText('Type "DEACTIVATE" to confirm');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveAccessibleDescription(/Type DEACTIVATE exactly/i);
  });

  it("shows an inline mismatch error and blocks confirmation", () => {
    const { onConfirm } = renderDialog();

    const input = screen.getByLabelText('Type "DEACTIVATE" to confirm');
    fireEvent.change(input, { target: { value: "DEACTIVATE " } });

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("The confirmation must match DEACTIVATE exactly."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm deactivation" }),
    ).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms only the exact token", () => {
    const { onConfirm } = renderDialog();

    fireEvent.change(screen.getByLabelText('Type "DEACTIVATE" to confirm'), {
      target: { value: "DEACTIVATE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm deactivation" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
