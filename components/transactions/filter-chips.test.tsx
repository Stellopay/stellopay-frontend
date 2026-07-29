import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterChips, { type FilterChip } from "./filter-chips";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FilterChips", () => {
  const sampleChips: FilterChip[] = [
    { key: "status", label: "Status", value: "Payment Sent" },
    { key: "minAmount", label: "Min", value: "$50" },
    { key: "counterparty", label: "Counterparty", value: "GABCDE...XYZ" },
  ];

  it("renders nothing when chips array is empty", () => {
    const { container } = render(
      <FilterChips chips={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all chips with correct labels and values", () => {
    render(
      <FilterChips
        chips={sampleChips}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText("Status:")).toBeInTheDocument();
    expect(screen.getByText("Payment Sent")).toBeInTheDocument();
    expect(screen.getByText("Min:")).toBeInTheDocument();
    expect(screen.getByText("$50")).toBeInTheDocument();
    expect(screen.getByText("Counterparty:")).toBeInTheDocument();
    expect(screen.getByText("GABCDE...XYZ")).toBeInTheDocument();
  });

  it("renders the region with accessible label", () => {
    render(
      <FilterChips
        chips={sampleChips}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
        ariaLabel="My custom label"
      />,
    );

    const region = screen.getByRole("region", { name: "My custom label" });
    expect(region).toBeInTheDocument();
  });

  it("uses default aria-label when not provided", () => {
    render(
      <FilterChips chips={sampleChips} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );

    expect(
      screen.getByRole("region", { name: "Active filters" }),
    ).toBeInTheDocument();
  });

  it("shows the 'Active Filters' label", () => {
    render(
      <FilterChips chips={sampleChips} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );

    expect(screen.getByText("Active Filters:")).toBeInTheDocument();
  });

  it("calls onRemove with the chip key when remove button is clicked", async () => {
    const onRemove = vi.fn();
    render(
      <FilterChips
        chips={sampleChips}
        onRemove={onRemove}
        onClearAll={vi.fn()}
      />,
    );

    const removeBtn = screen.getByRole("button", {
      name: "Remove Status filter: Payment Sent",
    });
    await userEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith("status");
  });

  it("shows 'Clear all' link when there are multiple chips", () => {
    render(
      <FilterChips
        chips={sampleChips}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Clear all active filters" }),
    ).toBeInTheDocument();
  });

  it("does NOT show 'Clear all' link when there is only one chip", () => {
    render(
      <FilterChips
        chips={[sampleChips[0]!]}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Clear all active filters" }),
    ).not.toBeInTheDocument();
  });

  it("calls onClearAll when 'Clear all' is clicked", async () => {
    const onClearAll = vi.fn();
    render(
      <FilterChips
        chips={sampleChips}
        onRemove={vi.fn()}
        onClearAll={onClearAll}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Clear all active filters" }),
    );
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("remove buttons have accessible names", () => {
    render(
      <FilterChips
        chips={sampleChips}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Remove Status filter: Payment Sent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Min filter: $50" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Remove Counterparty filter: GABCDE...XYZ",
      }),
    ).toBeInTheDocument();
  });
});
