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
import { generateTransactionReceiptPdf } from "./receipt";

const LONG_ADDRESS = "GA4GYKB4JP2K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y";
const TRUNCATED_ADDRESS = "GA4GYK...BH4GJ6";

const mockTransactions = [
  {
    id: "1",
    type: "Deposit",
    txId: "TX123",
    address: LONG_ADDRESS,
    date: "2023-10-27",
    time: "10:00 AM",
    token: "ETH",
    amount: "+1000000000000000000000000000.00",
    status: "Completed" as const,
    tokenIcon: "/icons/eth.svg",
    statusColor: "success" as const,
  },
];

vi.mock("./receipt", () => ({
  generateTransactionReceiptPdf: vi.fn(() => Promise.resolve()),
}));

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
    // 1 header row + 3 data rows = 4
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
    expect(amountElements[0]).toHaveClass("truncate");
  });

  it("address tooltip element has tabIndex=0 for keyboard accessibility", () => {
    render(<TransactionsTable transactions={[LONG_VALUE_TRANSACTION]} />);

    const addressElements = screen.getAllByTitle(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef",
    );
    expect(addressElements[0]).toHaveAttribute("tabIndex", "0");
  });

  it("amount tooltip element has tabIndex=0 for keyboard accessibility", () => {
    render(<TransactionsTable transactions={[LONG_VALUE_TRANSACTION]} />);

    const amountElements = screen.getAllByTitle(
      "+1000000000000000000000000000.00",
    );
    expect(amountElements[0]).toHaveAttribute("tabIndex", "0");
  });
});

describe("TransactionsTable — keyboard navigation", () => {
  it("each data row has tabIndex=0 and data-navigable attribute", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const rows = getDataRows();
    expect(rows).toHaveLength(3);
    rows.forEach((r) => expect(r).toHaveAttribute("tabindex", "0"));
  });

  it("ArrowDown moves focus from row 0 to row 1", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const [row0, row1] = getDataRows();
    act(() => row0.focus());
    fireEvent.keyDown(row0, { key: "ArrowDown" });
    expect(document.activeElement).toBe(row1);
  });

  it("ArrowDown moves focus from row 1 to row 2", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const [, row1, row2] = getDataRows();
    act(() => row1.focus());
    fireEvent.keyDown(row1, { key: "ArrowDown" });
    expect(document.activeElement).toBe(row2);
  });

  it("ArrowUp moves focus from row 2 to row 1", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const [, row1, row2] = getDataRows();
    act(() => row2.focus());
    fireEvent.keyDown(row2, { key: "ArrowUp" });
    expect(document.activeElement).toBe(row1);
  });

  it("ArrowUp moves focus from row 1 to row 0", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const [row0, row1] = getDataRows();
    act(() => row1.focus());
    fireEvent.keyDown(row1, { key: "ArrowUp" });
    expect(document.activeElement).toBe(row0);
  });

  it("ArrowDown on the last row keeps focus on the last row", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const rows = getDataRows();
    const last = rows[rows.length - 1];
    act(() => last.focus());
    fireEvent.keyDown(last, { key: "ArrowDown" });
    expect(document.activeElement).toBe(last);
  });

  it("ArrowUp on the first row keeps focus on the first row", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const [first] = getDataRows();
    act(() => first.focus());
    fireEvent.keyDown(first, { key: "ArrowUp" });
    expect(document.activeElement).toBe(first);
  });

  it("Home moves focus to the first row from anywhere", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const rows = getDataRows();
    const last = rows[rows.length - 1];
    act(() => last.focus());
    fireEvent.keyDown(last, { key: "Home" });
    expect(document.activeElement).toBe(rows[0]);
  });

  it("End moves focus to the last row from anywhere", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const [first, , last] = getDataRows();
    act(() => first.focus());
    fireEvent.keyDown(first, { key: "End" });
    expect(document.activeElement).toBe(last);
  });

  it("unrelated keys (Enter) do not move focus", () => {
    render(<TransactionsTable transactions={THREE_ROWS} />);
    const [row0] = getDataRows();
    act(() => row0.focus());
    fireEvent.keyDown(row0, { key: "Enter" });
    expect(document.activeElement).toBe(row0);
  });
});

describe("TransactionsTable — empty and loading states", () => {
  it("renders the empty state when no transactions are provided", () => {
    render(<TransactionsTable transactions={[]} />);
    expect(screen.getAllByText(/no transactions found/i).length).toBeGreaterThan(0);
  });

  it("renders skeleton rows when isLoading is true", () => {
    render(<TransactionsTable transactions={[]} isLoading />);
    // No data rows, no empty state text
    expect(screen.queryAllByText(/no transactions found/i)).toHaveLength(0);
    // Skeleton rows still produce <tr> elements
    expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
  });

  it("renders with logical spacing properties in RTL direction", () => {
    render(
      <div dir="rtl">
        <TransactionsTable transactions={[LONG_VALUE_TRANSACTION]} />
      </div>
    );

    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();

    const addressElements = screen.getAllByTitle("0x1234567890abcdef1234567890abcdef1234567890abcdef");
    expect(addressElements.length).toBeGreaterThan(0);
    expect(addressElements[0]).toHaveClass("-ms-1");
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

    await waitFor(() => {
      expect(generateTransactionReceiptPdf).toHaveBeenCalledWith(transaction);
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't generate the receipt/i
    );
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
    // Should render skeleton rows instead of empty state
    expect(screen.queryByText("No Transactions Found")).not.toBeInTheDocument();
    // Verify skeleton elements are present
    const skeletons = container.querySelectorAll(".skeleton-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
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
    // The parent wrapper is hidden below md
    expect(toggle.closest(".hidden")).toBeTruthy();
  });
});
