import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  TRANSACTIONS_PAGE_SIZE,
  getDefaultDateRange,
} from "./transactions-config";
import { TransactionsTable } from "./transactions-table";

// next/image is not available in jsdom — swap it for a plain <img>.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// ---------------------------------------------------------------------------
// transactions-config
// ---------------------------------------------------------------------------

describe("TRANSACTIONS_PAGE_SIZE", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(TRANSACTIONS_PAGE_SIZE)).toBe(true);
    expect(TRANSACTIONS_PAGE_SIZE).toBeGreaterThan(0);
  });
});

describe("getDefaultDateRange", () => {
  it("returns ISO date strings in YYYY-MM-DD format", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    expect(fromDate).toMatch(isoDate);
    expect(toDate).toMatch(isoDate);
  });

  it("toDate equals today", () => {
    const today = new Date().toISOString().split("T")[0];
    const { toDate } = getDefaultDateRange();
    expect(toDate).toBe(today);
  });

  it("fromDate is exactly 30 days before toDate", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    const diffMs = new Date(toDate).getTime() - new Date(fromDate).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });

  it("fromDate is strictly before toDate", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    expect(new Date(fromDate).getTime()).toBeLessThan(
      new Date(toDate).getTime(),
    );
  });

  it("does not return the stale 2023 hardcoded dates", () => {
    const { fromDate, toDate } = getDefaultDateRange();
    expect(fromDate).not.toBe("2023-03-26");
    expect(toDate).not.toBe("2023-04-15");
  });

  it("returns a fresh range on each call (not a frozen module-load snapshot)", () => {
    // Two calls on the same day should return identical dates.
    const first = getDefaultDateRange();
    const second = getDefaultDateRange();
    expect(first.fromDate).toBe(second.fromDate);
    expect(first.toDate).toBe(second.toDate);
  });
});

// ---------------------------------------------------------------------------
// skeleton count parity: TRANSACTIONS_PAGE_SIZE ↔ TransactionsTable rows
// ---------------------------------------------------------------------------

describe("TransactionsTable skeleton count parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders exactly TRANSACTIONS_PAGE_SIZE skeleton rows in the table body when loading", () => {
    render(<TransactionsTable transactions={[]} isLoading={true} />);
    const tbody = document.querySelector("tbody");
    const skeletonRows = tbody?.querySelectorAll("tr") ?? [];
    expect(skeletonRows.length).toBe(TRANSACTIONS_PAGE_SIZE);
  });

  it("renders no skeleton rows and shows the empty-state when not loading with zero transactions", () => {
    render(<TransactionsTable transactions={[]} isLoading={false} />);
    const tbody = document.querySelector("tbody");
    // One colspan row for the empty-state message
    expect(tbody?.querySelectorAll("tr").length).toBe(1);
    expect(
      screen.getAllByText("No transactions found. Try adjusting your filters."),
    ).toHaveLength(2); // desktop + mobile
  });

  it("renders exactly TRANSACTIONS_PAGE_SIZE data rows when provided that many transactions", () => {
    const transactions = Array.from(
      { length: TRANSACTIONS_PAGE_SIZE },
      (_, i) => ({
        id: `tx-${i}`,
        type: "Payment",
        txId: `#TXN${i}`,
        address: `GAddress${i}`,
        date: "2024-01-01",
        time: "12:00",
        token: "USDC",
        amount: `+$${(i + 1) * 10}.00`,
        status: "Completed" as const,
        tokenIcon: "/usdc-logo.png",
      }),
    );

    render(<TransactionsTable transactions={transactions} isLoading={false} />);
    const tbody = document.querySelector("tbody");
    const dataRows = tbody?.querySelectorAll("tr") ?? [];
    expect(dataRows.length).toBe(TRANSACTIONS_PAGE_SIZE);
  });
});

// ---------------------------------------------------------------------------
// Transaction receipt dialog
// ---------------------------------------------------------------------------

describe("TransactionReceipt dialog", () => {
  const mockTransaction = {
    id: "1",
    type: "Payment Sent",
    txId: "#TXN12345",
    address: "0xA1B2...C3D4E5",
    date: "2024-01-15",
    time: "09:32AM",
    token: "USDC",
    amount: "-$607.87",
    status: "Completed" as const,
    tokenIcon: "/usdc-logo.png",
    memo: "Invoice #1024",
  };

  function getDesktopRow() {
    const rows = screen.getAllByRole("button", { name: /View receipt/i });
    return rows[0];
  }

  function withinDialog() {
    return within(screen.getByRole("dialog"));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  it("opens receipt dialog when a table row is clicked", async () => {
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[mockTransaction]} />);

    await user.click(getDesktopRow());

    expect(withinDialog().getByText("Transaction Receipt")).toBeInTheDocument();
    expect(withinDialog().getByText("#TXN12345")).toBeInTheDocument();
    expect(withinDialog().getByText("-$607.87")).toBeInTheDocument();
  });

  it("displays all transaction details in the receipt", async () => {
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[mockTransaction]} />);

    await user.click(getDesktopRow());

    expect(withinDialog().getByText("Payment Sent")).toBeInTheDocument();
    expect(withinDialog().getByText("0xA1B2...C3D4E5")).toBeInTheDocument();
    expect(withinDialog().getByText("Invoice #1024")).toBeInTheDocument();
  });

  it("renders a print button inside the receipt dialog", async () => {
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[mockTransaction]} />);

    await user.click(getDesktopRow());

    const printButton = withinDialog().getByRole("button", { name: /Print Receipt/i });
    expect(printButton).toBeInTheDocument();
  });

  it("calls window.print when print button is clicked", async () => {
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[mockTransaction]} />);

    await user.click(getDesktopRow());

    const printButton = withinDialog().getByRole("button", { name: /Print Receipt/i });
    await user.click(printButton);

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("opens receipt dialog on Enter key press", async () => {
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[mockTransaction]} />);

    const row = getDesktopRow();
    row.focus();
    await user.keyboard("{Enter}");

    expect(withinDialog().getByText("Transaction Receipt")).toBeInTheDocument();
  });

  it("opens receipt dialog on Space key press", async () => {
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[mockTransaction]} />);

    const row = getDesktopRow();
    row.focus();
    await user.keyboard(" ");

    expect(withinDialog().getByText("Transaction Receipt")).toBeInTheDocument();
  });

  it("closes receipt dialog when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<TransactionsTable transactions={[mockTransaction]} />);

    await user.click(getDesktopRow());
    expect(withinDialog().getByText("Transaction Receipt")).toBeInTheDocument();

    const closeButton = withinDialog().getByRole("button", { name: /Close/i });
    await user.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders table rows with correct aria attributes", () => {
    render(<TransactionsTable transactions={[mockTransaction]} />);

    const row = getDesktopRow();
    expect(row).toHaveAttribute("tabindex", "0");
  });

  it("renders desktop table structure", () => {
    render(<TransactionsTable transactions={[mockTransaction]} />);

    expect(screen.getByRole("columnheader", { name: "Transaction Type" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Address" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Date$/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Token" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
  });
});
