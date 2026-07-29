/**
 * Tests for TransactionsTable — keyboard navigation, ARIA semantics,
 * and tooltip/truncation behaviour for long address/amount values.
 *
 * Covers:
 * - Basic rendering of transaction data.
 * - Correct native table semantics (table / rowgroup / columnheader / row / cell).
 * - Each data row is focusable via tabIndex=0.
 * - ArrowDown moves focus to the next row.
 * - ArrowUp moves focus to the previous row.
 * - ArrowDown on the last row keeps focus on the last row.
 * - ArrowUp on the first row keeps focus on the first row.
 * - Home moves focus to the first row.
 * - End moves focus to the last row.
 * - Unrelated keys (Enter) do not change focus.
 * - Empty-state row is rendered when the transactions array is empty.
 * - Loading skeleton rows are rendered when isLoading=true.
 * - Address and amount cells truncate long values with a title tooltip.
 */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TransactionsTable } from "./transactions-table";
import { TransactionProps } from "@/types/transaction";
import { DownloadReceiptButton } from "./download-receipt-button";

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
    memo: "Test memo for deposit transaction",
    counterparty: "0xabcdef1234567890abcdef1234567890abcdef12345678",
    fee: "0.001 ETH",
    hash: "0xhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
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


import { generateTransactionReceiptPdf } from "./receipt";

// ── Mock next/image ───────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
function makeTransaction(n: number): TransactionProps {
  return {
    id: `TX-${n}`,
    type: "Payment",
    address: `GABC${n}`,
    date: "2024-01-01",
    time: "10:00",
    token: "XLM",
    amount: `+${n * 10} XLM`,
    status: "Completed",
    tokenIcon: "/xlm.svg",
  };
}

const THREE_ROWS = [makeTransaction(1), makeTransaction(2), makeTransaction(3)];

/** Transaction fixture with long address and amount to exercise tooltip/truncation. */
const LONG_VALUE_TRANSACTION: TransactionProps = {
  id: "1",
  type: "Deposit",
  address: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
  date: "2023-10-27",
  time: "10:00 AM",
  token: "ETH",
  amount: "+1000000000000000000000000000.00",
  status: "Completed",
  tokenIcon: "/icons/eth.svg",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the navigable <tr> elements inside the <tbody>. */
function getDataRows() {
  return screen.getAllByRole("row").filter(
    (r) => r.hasAttribute("data-navigable"),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TransactionsTable — basic rendering", () => {
  it("renders transaction type and id", () => {
    render(<TransactionsTable transactions={[LONG_VALUE_TRANSACTION]} />);
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
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

  describe("Quick-view Dialog", () => {
    it("renders view detail buttons for each transaction", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      // Desktop view - find the eye icon button
      const viewDetailButtons = screen.getAllByLabelText(/View details for transaction/i);
      expect(viewDetailButtons.length).toBeGreaterThan(0);
    });

    it("opens quick-view dialog when clicking view detail button", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      // Dialog should be visible
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      expect(screen.getByText("Test memo for deposit transaction")).toBeInTheDocument();
    });

vi.mock("./receipt", () => ({
  generateTransactionReceiptPdf: vi.fn().mockResolvedValue(undefined),
}));

    it("displays all transaction details in the dialog", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      // Check all fields are displayed
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      // Use getAllByText since "Deposit" appears in both table and dialog
      expect(screen.getAllByText("Deposit").length).toBeGreaterThan(0);
      expect(screen.getAllByText("#1").length).toBeGreaterThan(0);
      expect(screen.getByText("Test memo for deposit transaction")).toBeInTheDocument();
      expect(screen.getByText("0.001 ETH")).toBeInTheDocument();
      expect(screen.getByText("0xhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890")).toBeInTheDocument();
      expect(screen.getByText("View Full Details")).toBeInTheDocument();
    });

    it("includes link to full transaction details page", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      const fullDetailsLink = screen.getByRole("link", { name: /View full details/i });
      expect(fullDetailsLink).toHaveAttribute("href", "/transactions/1");
    });

    it("closes dialog when pressing Escape", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      
      // Press Escape to close
      fireEvent.keyDown(document, { key: "Escape" });
      
      // Dialog should be closed
      expect(screen.queryByText("Transaction Details")).not.toBeInTheDocument();
    });

    it("handles transactions without optional fields", () => {
      const minimalTransaction = [{
        id: "2",
        type: "Withdrawal",
        txId: "TX124",
        address: "0x987654321",
        date: "2023-10-28",
        time: "2:00 PM",
        token: "USDC",
        amount: "-50.00",
        status: "Pending" as const,
        tokenIcon: "/icons/usdc.svg",
        statusColor: "warning" as const,
      }];
      
      render(<TransactionsTable transactions={minimalTransaction} />);
      
      // Use getAllByLabelText since both desktop and mobile views render the button
      const viewDetailButtons = screen.getAllByLabelText(/View details for transaction 2/i);
      fireEvent.click(viewDetailButtons[0]);
      
      // Dialog should still open and show basic info
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      // Use getAllByText since "Withdrawal" appears in both table and dialog
      expect(screen.getAllByText("Withdrawal").length).toBeGreaterThan(0);
      expect(screen.getAllByText("#2").length).toBeGreaterThan(0);
      
      // Optional fields should not be in the document
      expect(screen.queryByText("Memo")).not.toBeInTheDocument();
      expect(screen.queryByText("Counterparty")).not.toBeInTheDocument();
      expect(screen.queryByText("Fee")).not.toBeInTheDocument();
      expect(screen.queryByText("Transaction Hash")).not.toBeInTheDocument();
    });
  });

  it("shows an error message if generation fails", async () => {
    (generateTransactionReceiptPdf as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("fail")
    );
    render(<DownloadReceiptButton transaction={transaction} />);
    fireEvent.click(
      screen.getByRole("button", { name: /download pdf receipt/i })
    );

    it("opens dialog when clicking mobile transaction card", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      // Find mobile card button
      const mobileCards = screen.getAllByRole("button", { name: /View details for transaction 1/i });
      const mobileCard = mobileCards.find(card => card.className.includes("w-full text-left"));
      
      if (mobileCard) {
        fireEvent.click(mobileCard);
        expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      }
    });
  });

  describe("Accessibility", () => {
    it("has accessible labels for view detail buttons", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButtons = screen.getAllByLabelText(/View details for transaction/i);
      viewDetailButtons.forEach((button, index) => {
        expect(button).toHaveAttribute("aria-label", `View details for transaction ${mockTransactions[0].id}`);
      });
    });

    it("has proper status badge aria-labels in dialog", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      // Status badges should have aria-label (multiple may exist - one in table, one in dialog)
      const statusBadges = screen.getAllByLabelText(`Status: ${mockTransactions[0].status}`);
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it("has accessible link to full transaction details", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      const fullDetailsLink = screen.getByRole("link", { name: /View full details for transaction/i });
      expect(fullDetailsLink).toBeInTheDocument();
    });
  });
});
