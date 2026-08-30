import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

/** Opens the dialog and types the exact token so the confirm button is enabled. */
function openDialogAndType(onConfirm = vi.fn()) {
  renderOpenDialog(onConfirm);
  fireEvent.change(getInput(), { target: { value: "DEACTIVATE" } });
  return { onConfirm };
}

/** An `onConfirm` handler backed by a manually-resolved promise. */
function deferredConfirm() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const onConfirm = vi.fn(() => promise);
  return { onConfirm, resolve, reject };
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

  it("never fires onConfirm when the button is clicked while disabled", () => {
    const { onConfirm } = renderOpenDialog();

    fireEvent.click(getConfirmButton());
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(getInput(), { target: { value: "deactivate" } });
    fireEvent.click(getConfirmButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("clears the typed value and re-disables the confirm button when the dialog is reopened", () => {
    const { onConfirm } = renderOpenDialog();
    const input = getInput();
    const confirmButton = getConfirmButton();

    fireEvent.change(input, { target: { value: "DEACTIVATE" } });
    expect(confirmButton).toBeEnabled();
    expect(input).toHaveValue("DEACTIVATE");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Deactivate account" }));
    const reopenedInput = getInput();
    const reopenedConfirmButton = getConfirmButton();

    expect(reopenedInput).toHaveValue("");
    expect(reopenedConfirmButton).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
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

  it("confirms only on an exact, case-correct token", async () => {
    const { onConfirm } = renderOpenDialog();

    fireEvent.change(getInput(), { target: { value: "DEACTIVATE" } });

    const input = getInput();
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const confirmButton = getConfirmButton();
    expect(confirmButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(confirmButton);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Idempotency: one request per confirmation
  // -------------------------------------------------------------------------

  it("issues exactly one request on a rapid double click", async () => {
    const { onConfirm, resolve } = deferredConfirm();
    openDialogAndType(onConfirm);

    const confirmButton = getConfirmButton();
    // Both click events arrive before React re-renders, mimicking a fast
    // double click / held pointer.
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => resolve());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("issues exactly one request on keyboard (Enter) repeat", async () => {
    const { onConfirm, resolve } = deferredConfirm();
    openDialogAndType(onConfirm);

    const confirmButton = getConfirmButton();
    confirmButton.focus();
    // A held Enter synthesizes a click per keydown on the focused button; each
    // keyboard-activated click carries `detail: 0`.
    fireEvent.click(confirmButton, { detail: 0 });
    fireEvent.click(confirmButton, { detail: 0 });
    fireEvent.click(confirmButton, { detail: 0 });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    // Once pending, the button is disabled so further key repeats are inert.
    expect(confirmButton).toBeDisabled();

    await act(async () => resolve());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  // -------------------------------------------------------------------------
  // Pending state: dialog must not close before the request resolves
  // -------------------------------------------------------------------------

  it("stays open and disables its controls while the request is pending", async () => {
    const { onConfirm, resolve } = deferredConfirm();
    openDialogAndType(onConfirm);

    fireEvent.click(getConfirmButton());

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(getConfirmButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(getInput()).toBeDisabled();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");

    // Escape and the close (X) affordance must not dismiss while in flight.
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => resolve());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  // -------------------------------------------------------------------------
  // Rejection + retry
  // -------------------------------------------------------------------------

  it("keeps the dialog open and re-enables confirm when the request rejects", async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error("Request failed")));
    openDialogAndType(onConfirm);

    fireEvent.click(getConfirmButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/request failed/i);
    expect(alert).toHaveTextContent(/retry/i);

    // Dialog never closed, token is preserved, confirm is available again.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(getInput()).toHaveValue("DEACTIVATE");
    expect(getConfirmButton()).toBeEnabled();
  });

  it("allows a retry after a recoverable failure", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error("Request failed"))
      .mockResolvedValueOnce(undefined);
    openDialogAndType(onConfirm);

    fireEvent.click(getConfirmButton());
    await screen.findByRole("alert");

    // Retry succeeds and the dialog closes once the request resolves.
    fireEvent.click(getConfirmButton());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("clears the failure notice when the user edits the confirmation input", async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error("Request failed")));
    openDialogAndType(onConfirm);

    fireEvent.click(getConfirmButton());
    await screen.findByRole("alert");

    fireEvent.change(getInput(), { target: { value: "DEACTIVAT" } });
    expect(screen.queryByText(/request failed/i)).not.toBeInTheDocument();
  });
});
