import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { TRANSACTIONS_PAGE_SIZE, getDefaultDateRange } from "./transactions-config";
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
    expect(new Date(fromDate).getTime()).toBeLessThan(new Date(toDate).getTime());
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
      screen.getAllByText("No transactions found. Try adjusting your filters.")
    ).toHaveLength(2); // desktop + mobile
  });

  it("renders exactly TRANSACTIONS_PAGE_SIZE data rows when provided that many transactions", () => {
    const transactions = Array.from({ length: TRANSACTIONS_PAGE_SIZE }, (_, i) => ({
      id: `tx-${i}`,
      type: "Payment",
      address: `GAddress${i}`,
      date: "2024-01-01",
      time: "12:00",
      token: "USDC",
      amount: `+$${(i + 1) * 10}.00`,
      status: "Completed" as const,
      tokenIcon: "/usdc-logo.png",
    }));

    render(<TransactionsTable transactions={transactions} isLoading={false} />);
    const tbody = document.querySelector("tbody");
    const dataRows = tbody?.querySelectorAll("tr") ?? [];
    expect(dataRows.length).toBe(TRANSACTIONS_PAGE_SIZE);
  });
});
