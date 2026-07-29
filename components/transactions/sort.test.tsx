import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SortControl from "./sort";
import type { SortConfig } from "@/types/transaction";

// ─── Mock Radix UI DropdownMenu ─────────────────────────────────────────
// jsdom does not implement the Portal API that Radix DropdownMenu depends
// on, so we mock the primitives with plain div/button wrappers to test
// render logic and click handlers.
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) => (
    <button data-testid="dropdown-trigger" {...props}>
      {children}
    </button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
  }) => (
    <div
      data-testid="dropdown-item"
      className={className}
      onClick={onClick}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  ),
}));

// ─── Test data ───────────────────────────────────────────────────────────

const defaultSortConfigs: SortConfig[] = [
  { field: "date", direction: "desc" },
];

const multiSortConfigs: SortConfig[] = [
  { field: "status", direction: "asc" },
  { field: "amount", direction: "desc" },
];

describe("SortControl", () => {
  it("renders the trigger button with primary sort label", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const trigger = screen.getByTestId("dropdown-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Date");
    expect(trigger).toHaveTextContent("↓");
  });

  it("renders 'Sort' as default label when no sort configs are set", () => {
    render(
      <SortControl
        sortConfigs={[]}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const trigger = screen.getByTestId("dropdown-trigger");
    expect(trigger).toHaveTextContent("Sort");
  });

  it("renders all sort field options in the dropdown", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const items = screen.getAllByTestId("dropdown-item");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Date");
    expect(items[1]).toHaveTextContent("Amount");
    expect(items[2]).toHaveTextContent("Type");
    expect(items[3]).toHaveTextContent("Status");
  });

  it("shows sort order indicator (#2) for secondary sort item", () => {
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const items = screen.getAllByTestId("dropdown-item");
    // Status (primary) should show arrow
    expect(items[3]).toHaveTextContent("↑");
    // Amount (secondary) should show arrow and #2 indicator
    expect(items[1]).toHaveTextContent("↓");
    expect(items[1]).toHaveTextContent("#2");
  });

  it("calls onSort with the field and shiftKey=false on normal click", () => {
    const handleSort = vi.fn();
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={handleSort}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const items = screen.getAllByTestId("dropdown-item");
    fireEvent.click(items[1]!); // Click "Amount"
    expect(handleSort).toHaveBeenCalledWith("amount", { shiftKey: false });
  });

  it("passes shiftKey=true when shift-clicking", () => {
    const handleSort = vi.fn();
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={handleSort}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const items = screen.getAllByTestId("dropdown-item");
    fireEvent.click(items[2]!, { shiftKey: true }); // Shift-click "Type"
    expect(handleSort).toHaveBeenCalledWith("type", { shiftKey: true });
  });

  it("shows the secondary sort chip when secondary config is present", () => {
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    // The secondary chip text includes "then Amount ↓"
    expect(screen.getByText(/then Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it("does NOT show secondary sort chip when only primary is set", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    expect(screen.queryByText(/then/i)).not.toBeInTheDocument();
  });

  it("calls onClearSecondarySort when the chip close button is clicked", () => {
    const handleClear = vi.fn();
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={handleClear}
      />,
    );
    const closeBtn = screen.getByLabelText("Clear secondary sort");
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("has accessible aria-label on the trigger button", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const trigger = screen.getByLabelText("Sort transactions");
    expect(trigger).toBeInTheDocument();
  });

  it("has accessible aria-label on the clear secondary sort button", () => {
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const closeBtn = screen.getByLabelText("Clear secondary sort");
    expect(closeBtn).toBeInTheDocument();
  });
});
