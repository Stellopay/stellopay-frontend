import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdvancedFilterPanel, {
  type AdvancedFilterValues,
} from "./advanced-filter-panel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultValues: AdvancedFilterValues = {
  status: "All Transactions",
  minAmount: "",
  maxAmount: "",
  counterparty: "",
  fromDate: "2024-01-01",
  toDate: "2024-01-31",
};

function renderPanel(
  overrides: Partial<{
    open: boolean;
    values: AdvancedFilterValues;
  }> = {},
) {
  const onOpenChange = vi.fn();
  const onValuesChange = vi.fn();
  const onApply = vi.fn();
  const onClearAll = vi.fn();

  const utils = render(
    <AdvancedFilterPanel
      open={overrides.open ?? true}
      onOpenChange={onOpenChange}
      currentValues={overrides.values ?? defaultValues}
      onValuesChange={onValuesChange}
      onApply={onApply}
      onClearAll={onClearAll}
    />,
  );

  return {
    ...utils,
    onOpenChange,
    onValuesChange,
    onApply,
    onClearAll,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AdvancedFilterPanel", () => {
  beforeEach(() => {
    // Prevent body overflow side effects in tests
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  it("renders the panel with all filter sections when open", () => {
    renderPanel();

    expect(
      screen.getByRole("dialog", { name: "Advanced transaction filters" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Advanced Filters")).toBeInTheDocument();
    expect(screen.getByText("Transaction Status")).toBeInTheDocument();
    expect(screen.getByText("Amount Range (USD)")).toBeInTheDocument();
    expect(screen.getByText("Counterparty Address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear All" })).toBeInTheDocument();
  });

  it("is hidden from screen readers when closed", () => {
    renderPanel({ open: false });
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("is visible to screen readers when open", () => {
    renderPanel({ open: true });
    const dialog = screen.getByRole("dialog", {
      name: "Advanced transaction filters",
    });
    expect(dialog).toHaveAttribute("aria-hidden", "false");
  });

  // ── Close behavior ─────────────────────────────────────────────────────

  it("calls onOpenChange(false) when the close button is clicked", async () => {
    const { onOpenChange } = renderPanel();
    const closeBtn = screen.getByRole("button", {
      name: "Close advanced filters",
    });
    await userEvent.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when Escape is pressed", async () => {
    const { onOpenChange } = renderPanel();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("calls onOpenChange(false) when backdrop is clicked", async () => {
    const { onOpenChange } = renderPanel();
    // The backdrop is the first div with aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    await userEvent.click(backdrop!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // ── Status radio selection ─────────────────────────────────────────────

  it("calls onValuesChange when a status radio is changed", async () => {
    const { onValuesChange } = renderPanel();
    const paymentSentLabel = screen.getByText("Payment Sent");
    await userEvent.click(paymentSentLabel);
    expect(onValuesChange).toHaveBeenCalledWith({
      ...defaultValues,
      status: "Payment Sent",
    });
  });

  it("shows the current status as checked", () => {
    renderPanel({
      values: { ...defaultValues, status: "Payment Received" },
    });
    const radio = screen.getByDisplayValue("Payment Received");
    expect(radio).toBeChecked();
  });

  // ── Amount range inputs ────────────────────────────────────────────────

  it("calls onValuesChange when min amount changes", async () => {
    const { onValuesChange } = renderPanel();
    const minInput = screen.getByLabelText("Minimum amount");
    fireEvent.change(minInput, { target: { value: "100" } });
    expect(onValuesChange).toHaveBeenCalledWith({
      ...defaultValues,
      minAmount: "100",
    });
  });

  it("calls onValuesChange when max amount changes", async () => {
    const { onValuesChange } = renderPanel();
    const maxInput = screen.getByLabelText("Maximum amount");
    fireEvent.change(maxInput, { target: { value: "500" } });
    expect(onValuesChange).toHaveBeenCalledWith({
      ...defaultValues,
      maxAmount: "500",
    });
  });

  it("shows validation error when min > max", () => {
    renderPanel({
      values: { ...defaultValues, minAmount: "200", maxAmount: "50" },
    });
    expect(
      screen.getByText("Minimum amount cannot exceed maximum amount"),
    ).toBeInTheDocument();
  });

  it("does not show validation error when min <= max", () => {
    renderPanel({
      values: { ...defaultValues, minAmount: "50", maxAmount: "200" },
    });
    expect(
      screen.queryByText("Minimum amount cannot exceed maximum amount"),
    ).not.toBeInTheDocument();
  });

  // ── Counterparty input ─────────────────────────────────────────────────

  it("calls onValuesChange when counterparty changes", async () => {
    const { onValuesChange } = renderPanel();
    const input = screen.getByLabelText("Counterparty address");
    fireEvent.change(input, { target: { value: "GABCDE" } });
    expect(onValuesChange).toHaveBeenCalledWith({
      ...defaultValues,
      counterparty: "GABCDE",
    });
  });

  // ── Apply / Clear All buttons ──────────────────────────────────────────

  it("calls onApply when Apply Filters is clicked", async () => {
    const { onApply } = renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Apply Filters" }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("calls onClearAll when Clear All is clicked", async () => {
    const { onClearAll } = renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Clear All" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  // ── Disabled state ─────────────────────────────────────────────────────

  it("disables interactive elements when disabled is true", () => {
    render(
      <AdvancedFilterPanel
        open={true}
        onOpenChange={vi.fn()}
        currentValues={defaultValues}
        onValuesChange={vi.fn()}
        onApply={vi.fn()}
        onClearAll={vi.fn()}
        disabled={true}
      />,
    );

    expect(screen.getByLabelText("Minimum amount")).toBeDisabled();
    expect(screen.getByLabelText("Maximum amount")).toBeDisabled();
    expect(screen.getByLabelText("Counterparty address")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply Filters" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear All" })).toBeDisabled();
  });

  // ── Accessibility ──────────────────────────────────────────────────────

  it("has accessible name on the dialog", () => {
    renderPanel();
    expect(
      screen.getByRole("dialog", { name: "Advanced transaction filters" }),
    ).toBeInTheDocument();
  });

  it("has aria-modal on the dialog", () => {
    renderPanel();
    const dialog = screen.getByRole("dialog", {
      name: "Advanced transaction filters",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("validation error uses role=alert for screen reader announcement", () => {
    renderPanel({
      values: { ...defaultValues, minAmount: "200", maxAmount: "50" },
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Minimum amount cannot exceed maximum amount");
  });

  it("validation error uses aria-live=polite for non-intrusive announcement", () => {
    renderPanel({
      values: { ...defaultValues, minAmount: "200", maxAmount: "50" },
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  // ── Focus trap ─────────────────────────────────────────────────────────

  it("traps focus within the panel when open", async () => {
    renderPanel();

    // Focus should be inside the panel
    await waitFor(() => {
      const dialog = screen.getByRole("dialog", {
        name: "Advanced transaction filters",
      });
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  // ── Body scroll lock ───────────────────────────────────────────────────

  it("locks body scroll when open", () => {
    renderPanel({ open: true });
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when unmounted", () => {
    const { unmount } = renderPanel({ open: true });
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
