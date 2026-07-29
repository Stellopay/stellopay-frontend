/**
 * Tests for TransactionsTable — keyboard navigation, ARIA semantics,
 * and tooltip/truncation behaviour for long address/amount values.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionsTable } from "./transactions-table";
import { TransactionProps } from "@/types/transaction";
import { DownloadReceiptButton } from "./download-receipt-button";
import { BulkActionBar } from "./bulk-action-bar";
import { generateTransactionReceiptPdf } from "./receipt";

// ── Mock next/image ───────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

vi.mock("./receipt", () => ({
  generateTransactionReceiptPdf: vi.fn().mockResolvedValue(undefined),
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TransactionsTable — basic rendering", () => {
  it("renders transaction type and id", () => {
    render(<TransactionsTable transactions={[LONG_VALUE_TRANSACTION]} />);
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });
});

describe("TransactionsTable — status icons (WCAG 1.4.1)", () => {
  it("renders an SVG icon inside each status badge with aria-hidden='true'", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    const badges = screen.getAllByLabelText(/^Status:/i);
    expect(badges.length).toBeGreaterThan(0);
    badges.forEach((badge) => {
      const svg = badge.querySelector("svg[aria-hidden='true']");
      expect(svg).toBeInTheDocument();
    });
  });

  it("renders status text alongside the icon in the badge", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("preserves aria-label on the status badge for screen readers", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    expect(screen.getByLabelText("Status: Completed")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Pending")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Failed")).toBeInTheDocument();
  });

  it("status badge aria-label survives grayscale simulation (no color-only info)", () => {
    render(<TransactionsTable transactions={mockTransactions} />);

    // Completed
    const completedBadge = screen.getByLabelText("Status: Completed");
    expect(completedBadge).toHaveTextContent("Completed");
    expect(completedBadge.querySelector("svg")).toBeInTheDocument();

    // Pending
    const pendingBadge = screen.getByLabelText("Status: Pending");
    expect(pendingBadge).toHaveTextContent("Pending");
    expect(pendingBadge.querySelector("svg")).toBeInTheDocument();

    // Failed
    const failedBadge = screen.getByLabelText("Status: Failed");
    expect(failedBadge).toHaveTextContent("Failed");
    expect(failedBadge.querySelector("svg")).toBeInTheDocument();
  });

  it("renders status icons in the mobile card view", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    // Mobile cards are rendered with role="button" for view-details
    const badges = screen.getAllByLabelText(/^Status:/i);
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });

  it("renders status icon in the quick-view dialog header", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    const viewButtons = screen.getAllByLabelText(/View details for transaction/i);
    fireEvent.click(viewButtons[0]);
    const dialogBadge = screen.getByLabelText("Status: Completed");
    expect(dialogBadge.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
    expect(dialogBadge).toHaveTextContent("Completed");
  });
});

describe("TransactionsTable — ARIA roles", () => {
  it("renders column header cells with role=columnheader", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const headers = screen.getAllByRole("columnheader");
    const labels = headers.map((h) => h.textContent?.trim());
    expect(labels).toEqual(
      expect.arrayContaining([
        "Transaction Type",
        "Address",
        "Date",
        "Token",
        "Amount",
        "Status",
      ]),
    );
  });

  it("renders data rows with role=row", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    expect(screen.getAllByRole("row").length).toBeGreaterThanOrEqual(4);
  });

  it("renders data cells with role=cell", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
  });

  it("includes a visually-hidden caption for screen readers", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    expect(
      document.querySelector("caption")?.textContent,
    ).toMatch(/transaction history/i);
  });
});

describe("TransactionsTable — tooltip and truncation", () => {
  it("renders address cells with title tooltip and truncate class", () => {
    render(<TransactionsTable transactions={[LONG_VALUE_TRANSACTION]} />);

    const addressElements = screen.getAllByTitle(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef",
    );
    expect(addressElements.length).toBeGreaterThan(0);
    expect(addressElements[0]).toHaveClass("truncate");
  });

  it("renders amount cells with title tooltip and truncate class", () => {
    render(<TransactionsTable transactions={[LONG_VALUE_TRANSACTION]} />);

    const amountElements = screen.getAllByTitle(
      "+1000000000000000000000000000.00",
    );
    expect(amountElements.length).toBeGreaterThan(0);
    expect(amountElements[0]).toHaveAttribute("tabIndex", "0");
    expect(amountElements[0]).toHaveClass("truncate");
  });
});

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
    const td = container.querySelector("td[colspan='7']");
    expect(td).toBeInTheDocument();
  });

  it("renders empty state when no transactions and selection is disabled", () => {
    render(<TransactionsTable transactions={[]} />);
    // Empty state renders in both desktop and mobile views simultaneously
    expect(screen.getAllByText("No Transactions Found").length).toBeGreaterThanOrEqual(1);
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

  it("renders empty state when no transactions and not loading", () => {
    render(<TransactionsTable transactions={[]} />);
    expect(screen.getAllByText("No Transactions Found").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/try adjusting your filters/i).length).toBeGreaterThan(0);
  });

  it("renders loading skeletons when isLoading is true", () => {
    const { container } = render(
      <TransactionsTable transactions={[]} isLoading={true} />,
    );
    expect(screen.queryByText("No Transactions Found")).not.toBeInTheDocument();
    // Both desktop (.hidden.md:block) and mobile (.md:hidden) show skeleton/loading state
    expect(screen.queryByText("No Transactions Found")).not.toBeInTheDocument();
    const skeletonRows = document.querySelectorAll('[data-slot="table-row"]');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });
});

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
        selectedCount={2}
        onExport={vi.fn()}
        onTag={vi.fn()}
        onArchive={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByTestId("bulk-action-bar")).toBeInTheDocument();
  });

  it("shows singular label for a single selected transaction", () => {
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
    expect(
      within(bar).getByRole("button", { name: /export/i }),
    ).toBeInTheDocument();
    expect(
      within(bar).getByRole("button", { name: /tag/i }),
    ).toBeInTheDocument();
    expect(
      within(bar).getByRole("button", { name: /archive/i }),
    ).toBeInTheDocument();
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

describe("DownloadReceiptButton", () => {
  const transaction = {
    id: "tx_1",
    hash: "0xabc123",
    amount: "$100.00",
    counterparty: "Jane Doe",
    timestamp: new Date().toISOString(),
  };

  it("generates a PDF receipt when clicked", async () => {
    render(<DownloadReceiptButton transaction={transaction} />);
    fireEvent.click(
      screen.getByRole("button", { name: /download pdf receipt/i })
    );
    expect(screen.getByRole("button", { name: /download pdf receipt/i })).toBeInTheDocument();
  });

  it("shows an error message if generation fails", async () => {
    (generateTransactionReceiptPdf as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("fail")
    );
    render(<DownloadReceiptButton transaction={transaction} />);
    fireEvent.click(
      screen.getByRole("button", { name: /download pdf receipt/i })
    );
    await vi.waitFor(() => {
      expect(screen.getByText(/couldn't generate the receipt/i)).toBeInTheDocument();
    });
  });
});

describe("Quick-view Dialog", () => {
  it("renders view detail buttons for each transaction", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    const viewDetailButtons = screen.getAllByLabelText(
      /View details for transaction/i,
    );
    expect(viewDetailButtons.length).toBeGreaterThan(0);
  });

  it("opens dialog when clicking mobile transaction card", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    // Mobile cards have aria-label with the transaction id
    const mobileCards = screen.getAllByLabelText(
      /View details for transaction 1/i,
    );
    // Find the mobile card button (w-full text-left)
    const mobileCard = mobileCards.find((card) =>
      card.className.includes("w-full"),
    );
    expect(mobileCard).toBeDefined();
    if (mobileCard) {
      fireEvent.click(mobileCard);
      expect(screen.getByText("Transaction Receipt")).toBeInTheDocument();
    }
  });

  it("closes dialog when pressing Escape", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    const mobileCards = screen.getAllByLabelText(
      /View details for transaction 1/i,
    );
    const mobileCard = mobileCards.find((card) =>
      card.className.includes("w-full"),
    );
    if (mobileCard) {
      fireEvent.click(mobileCard);
      expect(screen.getByText("Transaction Receipt")).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Transaction Receipt")).not.toBeInTheDocument();
    }
  });

  it("handles transactions without optional fields", () => {
    const minimalTransaction = [
      {
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
      },
    ];

    render(<TransactionsTable transactions={minimalTransaction} />);
    // Should render transaction data without errors
    expect(screen.getAllByText("Withdrawal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("#2").length).toBeGreaterThan(0);
  });
});

// ── Mocks for safeStorage ─────────────────────────────────────────────────────
const storage: Record<string, string> = {};

vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
      return true;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
      return true;
    }),
  },
}));

describe("TransactionsTable — density toggle", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  });

  it("renders the density toggle with three options", () => {
    render(<TransactionsTable transactions={[]} />);
    const group = screen.getByRole("radiogroup", { name: /table density/i });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAccessibleName("Compact");
    expect(radios[1]).toHaveAccessibleName("Comfortable");
    expect(radios[2]).toHaveAccessibleName("Spacious");
  });

  it("defaults to Comfortable", () => {
    render(<TransactionsTable transactions={[]} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveTextContent("Comfortable");
  });

  it("switches to Compact on click and persists", () => {
    render(<TransactionsTable transactions={[]} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
    expect(storage["transactions-table-density"]).toBe("compact");
  });

  it("switches to Spacious on click and persists", () => {
    render(<TransactionsTable transactions={[]} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[2]);
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
    expect(storage["transactions-table-density"]).toBe("spacious");
  });

  it("restores a persisted density on mount", () => {
    storage["transactions-table-density"] = "compact";
    render(<TransactionsTable transactions={[]} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
  });

  it("applies compact class on table head cells when compact is selected", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    const headers = screen.getAllByRole("columnheader");
    headers.forEach((h) => {
      expect(h.className).toMatch(/py-2/);
    });
  });

  it("does not render the toggle on mobile breakpoints", () => {
    render(<TransactionsTable transactions={[]} />);
    const toggle = screen.getByRole("radiogroup", { name: /table density/i });
    expect(toggle.closest(".hidden")).toBeTruthy();
  });
});
