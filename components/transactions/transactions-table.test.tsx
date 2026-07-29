import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionsTable } from "./transactions-table";
import { BulkActionBar } from "./bulk-action-bar";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockTransactions = [
  {
    id: "1",
    type: "Deposit",
    txId: "TX123",
    address: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
    date: "2023-10-27",
    time: "10:00 AM",
    token: "ETH",
    amount: "+1000000000000000000000000000.00",
    status: "Completed" as const,
    tokenIcon: "/icons/eth.svg",
    statusColor: "success" as const,
  },
  {
    id: "2",
    type: "Withdrawal",
    txId: "TX456",
    address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    date: "2023-10-28",
    time: "11:30 AM",
    token: "USDC",
    amount: "-250.00",
    status: "Pending" as const,
    tokenIcon: "/icons/usdc.svg",
    statusColor: "warning" as const,
  },
  {
    id: "3",
    type: "Transfer",
    txId: "TX789",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    date: "2023-10-29",
    time: "09:15 AM",
    token: "XLM",
    amount: "+50.00",
    status: "Failed" as const,
    tokenIcon: "/icons/xlm.svg",
    statusColor: "destructive" as const,
  },
];

// ---------------------------------------------------------------------------
// TransactionsTable – baseline rendering
// ---------------------------------------------------------------------------

describe("TransactionsTable", () => {
  describe("baseline rendering (no selection props)", () => {
    it("renders transaction rows", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      expect(screen.getAllByText("Deposit")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Withdrawal")[0]).toBeInTheDocument();
    });

    it("shows the empty state when transactions array is empty", () => {
      render(<TransactionsTable transactions={[]} />);
      expect(screen.getAllByText("No Transactions Found").length).toBeGreaterThan(0);
    });

    it("shows the loading skeleton rows when isLoading=true", () => {
      const { container } = render(
        <TransactionsTable transactions={[]} isLoading />,
      );
      // Each skeleton uses the skeleton-shimmer class
      const skeletonDivs = container.querySelectorAll(".skeleton-shimmer");
      expect(skeletonDivs.length).toBeGreaterThan(0);
    });

    it("does NOT render checkboxes when selection props are omitted", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      expect(
        screen.queryByRole("checkbox"),
      ).not.toBeInTheDocument();
    });
  });
});

  // ──────────────────────────────────────────────────────────────────────────
  // Checkbox column and selection
  // ──────────────────────────────────────────────────────────────────────────

  describe("checkbox column (selection props provided)", () => {
    it("renders a header checkbox and one checkbox per row", () => {
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={new Set()}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      // 1 header + 3 rows = at least 4 checkboxes (doubled for mobile/desktop)
      const checkboxes = screen.getAllByRole("checkbox");
      // Desktop: 4 (1 header + 3 rows); Mobile: 3 (no header checkbox on mobile)
      // Total ≥ 4
      expect(checkboxes.length).toBeGreaterThanOrEqual(4);
    });

    it("header checkbox has accessible label for select-all", () => {
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={new Set()}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("checkbox", {
          name: /select all transactions on this page/i,
        }),
      ).toBeInTheDocument();
    });

    it("row checkboxes have accessible labels with transaction id", () => {
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={new Set()}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      // Each transaction id has at least one labelled checkbox
      expect(
        screen.getAllByRole("checkbox", { name: /select transaction 1/i })
          .length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("calls onSelectRow with the correct id and checked state", () => {
      const onSelectRow = vi.fn();
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={new Set()}
          onSelectRow={onSelectRow}
          onSelectAll={vi.fn()}
        />,
      );
      const rowCheckboxes = screen.getAllByRole("checkbox", {
        name: /select transaction 1/i,
      });
      fireEvent.click(rowCheckboxes[0]);
      expect(onSelectRow).toHaveBeenCalledWith("1", true);
    });

    it("calls onSelectAll with true when header checkbox is clicked (none selected)", () => {
      const onSelectAll = vi.fn();
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={new Set()}
          onSelectRow={vi.fn()}
          onSelectAll={onSelectAll}
        />,
      );
      const headerCheckbox = screen.getByRole("checkbox", {
        name: /select all transactions on this page/i,
      });
      fireEvent.click(headerCheckbox);
      expect(onSelectAll).toHaveBeenCalledWith(true);
    });

    it("calls onSelectAll with false when header checkbox is clicked (all selected)", () => {
      const allIds = new Set(["1", "2", "3"]);
      const onSelectAll = vi.fn();
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={allIds}
          onSelectRow={vi.fn()}
          onSelectAll={onSelectAll}
        />,
      );
      const headerCheckbox = screen.getByRole("checkbox", {
        name: /deselect all transactions on this page/i,
      });
      fireEvent.click(headerCheckbox);
      expect(onSelectAll).toHaveBeenCalledWith(false);
    });

    it("header checkbox is checked when all rows are selected", () => {
      const allIds = new Set(["1", "2", "3"]);
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={allIds}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      const headerCheckbox = screen.getByRole("checkbox", {
        name: /deselect all transactions on this page/i,
      });
      expect(headerCheckbox).toHaveAttribute("data-state", "checked");
    });

    it("header checkbox is indeterminate when some rows are selected", () => {
      const partialIds = new Set(["1"]);
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={partialIds}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      const headerCheckbox = screen.getByRole("checkbox", {
        name: /select all transactions on this page/i,
      });
      expect(headerCheckbox).toHaveAttribute("data-state", "indeterminate");
    });

    it("header checkbox is unchecked when no rows are selected", () => {
      render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={new Set()}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      const headerCheckbox = screen.getByRole("checkbox", {
        name: /select all transactions on this page/i,
      });
      expect(headerCheckbox).toHaveAttribute("data-state", "unchecked");
    });

    it("selected row has aria-selected=true", () => {
      const { container } = render(
        <TransactionsTable
          transactions={mockTransactions}
          selectedIds={new Set(["2"])}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      // Grab the desktop table rows (not the mobile cards which don't set aria-selected)
      const tableRows = container.querySelectorAll("tr[aria-selected='true']");
      expect(tableRows.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Tooltips for long text (regression)
  // ──────────────────────────────────────────────────────────────────────────

  describe("tooltips for long text values", () => {
    it("applies title and tabIndex to long addresses", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      const addressElements = screen.getAllByTitle(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef",
      );
      expect(addressElements.length).toBeGreaterThan(0);
      expect(addressElements[0]).toHaveAttribute("tabIndex", "0");
      expect(addressElements[0]).toHaveClass("truncate");
    });

    it("applies title and tabIndex to long amounts", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      const amountElements = screen.getAllByTitle(
        "+1000000000000000000000000000.00",
      );
      expect(amountElements.length).toBeGreaterThan(0);
      expect(amountElements[0]).toHaveAttribute("tabIndex", "0");
      expect(amountElements[0]).toHaveClass("truncate");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("renders empty state with correct colSpan when selection is enabled", () => {
      const { container } = render(
        <TransactionsTable
          transactions={[]}
          selectedIds={new Set()}
          onSelectRow={vi.fn()}
          onSelectAll={vi.fn()}
        />,
      );
      // colSpan should be 7 (6 data columns + 1 checkbox column)
      const td = container.querySelector("td[colspan='7']");
      expect(td).toBeInTheDocument();
    });

    it("renders empty state with colSpan 6 when selection is disabled", () => {
      const { container } = render(
        <TransactionsTable transactions={[]} />,
      );
      const td = container.querySelector("td[colspan='6']");
      expect(td).toBeInTheDocument();
    });

    it("handles an empty selectedIds set gracefully", () => {
      expect(() =>
        render(
          <TransactionsTable
            transactions={mockTransactions}
            selectedIds={new Set()}
            onSelectRow={vi.fn()}
            onSelectAll={vi.fn()}
          />,
        ),
      ).not.toThrow();
    });

    it("does not throw when selectedIds contains ids not in the current page", () => {
      expect(() =>
        render(
          <TransactionsTable
            transactions={mockTransactions}
            selectedIds={new Set(["999"])}
            onSelectRow={vi.fn()}
            onSelectAll={vi.fn()}
          />,
        ),
      ).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// BulkActionBar
// ---------------------------------------------------------------------------

describe("BulkActionBar", () => {
  it("returns null when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionBar
        selectedCount={0}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the bar when selectedCount > 0", () => {
    render(
      <BulkActionBar
        selectedCount={3}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByTestId("bulk-action-bar")).toBeInTheDocument();
  });

  it("shows singular label for exactly 1 selected transaction", () => {
    render(
      <BulkActionBar
        selectedCount={1}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByText("1 transaction selected")).toBeInTheDocument();
  });

  it("shows plural label for multiple selected transactions", () => {
    render(
      <BulkActionBar
        selectedCount={5}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByText("5 transactions selected")).toBeInTheDocument();
  });

  it("renders Export, Tag, Archive, and Clear selection buttons", () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    const bar = screen.getByTestId("bulk-action-bar");
    expect(within(bar).getByRole("button", { name: /export/i })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: /tag/i })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: /archive/i })).toBeInTheDocument();
    expect(
      within(bar).getByRole("button", { name: /clear selection/i }),
    ).toBeInTheDocument();
  });

  it("calls onExport when Export is clicked", () => {
    const onExport = vi.fn();
    render(
      <BulkActionBar
        selectedCount={2}
        onExport={onExport}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("calls onTag when Tag is clicked", () => {
    const onTag = vi.fn();
    render(
      <BulkActionBar
        selectedCount={2}
        onExport={vi.fn()}
        onTag={onTag}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /tag/i }));
    expect(onTag).toHaveBeenCalledTimes(1);
  });

  it("calls onArchive when Archive is clicked", () => {
    const onArchive = vi.fn();
    render(
      <BulkActionBar
        selectedCount={2}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={onArchive}
        onClearSelection={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /archive/i }));
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it("calls onClearSelection when the X button is clicked", () => {
    const onClearSelection = vi.fn();
    render(
      <BulkActionBar
        selectedCount={2}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={onClearSelection}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("has role=region with aria-label 'Bulk actions'", () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("region", { name: /bulk actions/i }),
    ).toBeInTheDocument();
  });

  it("has a toolbar with role=toolbar", () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });
});
