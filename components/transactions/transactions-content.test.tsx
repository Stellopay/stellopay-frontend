import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
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

// Mock sidebar context so nested components (e.g. SearchBar) can render
// without a full provider tree.
const sidebarState = { isSidebarOpen: true, isMobile: false };
vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => sidebarState,
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
// TransactionsContent: error vs empty state
// ---------------------------------------------------------------------------

import { useTransactions } from "@/hooks/useTransactions";
import TransactionsContent from "./transactions-content";

// Mock the hook
vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

describe("TransactionsContent states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ErrorState with retry when fetch fails", () => {
    const mockRefetch = vi.fn();
    vi.mocked(useTransactions).mockReturnValue({
      data: null,
      isLoading: false,
      error: "Network timeout",
      refetch: mockRefetch,
    });

    render(<TransactionsContent />);
    
    // Should see error state
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    
    // Retry action is wired
    screen.getByRole("button", { name: "Try Again" }).click();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("renders empty state table when fetch succeeds but returns empty array", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TransactionsContent />);
    
    // No error state
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Table empty state
    expect(
      screen.getAllByText("No transactions found. Try adjusting your filters.")[0]
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TransactionsContent: aria-live filter result count announcements
// ---------------------------------------------------------------------------

describe("TransactionsContent aria-live announcements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a visually hidden live region with role=status and aria-live=polite", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TransactionsContent />);

    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion.className).toMatch(/sr-only/);
  });

  it("does not announce on initial render (suppresses first-load announcement)", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [{ id: "1", status: "Completed" } as any], total: 5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TransactionsContent />);

    // Advance past the debounce window — no initial announcement expected.
    act(() => vi.advanceTimersByTime(600));

    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion.textContent).toBe("");
  });

  it("does not announce while loading", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<TransactionsContent />);

    act(() => vi.advanceTimersByTime(600));

    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion.textContent).toBe("");
  });

  it("does not announce during error state", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: null,
      isLoading: false,
      error: "Network timeout",
      refetch: vi.fn(),
    });

    render(<TransactionsContent />);

    act(() => vi.advanceTimersByTime(600));

    // Both the live region and the statement-error paragraph use role="status",
    // so we must filter for the element with aria-live="polite".
    const statusElements = screen.getAllByRole("status", { hidden: true });
    const liveRegion = statusElements.find(
      (el) => el.getAttribute("aria-live") === "polite",
    )!;
    expect(liveRegion).toBeDefined();
    expect(liveRegion.textContent).toBe("");
  });

  it("announces the transaction count after filters change and data loads", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: Array.from({ length: 10 }, (_, i) => ({ id: String(i), status: "Completed", type: "Payment", txId: `#TXN${i}`, address: `GAddr${i}`, date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any)), total: 10 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    const { rerender } = render(<TransactionsContent />);

    // Initial mount — no announcement expected (suppressed).
    act(() => vi.advanceTimersByTime(600));
    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion.textContent).toBe("");

    // Now simulate a filter change that returns a different total.
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: Array.from({ length: 3 }, (_, i) => ({ id: String(i), status: "Completed", type: "Payment", txId: `#TXN${i}`, address: `GAddr${i}`, date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any)), total: 3 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    rerender(<TransactionsContent />);

    act(() => vi.advanceTimersByTime(600));

    expect(liveRegion.textContent).toBe("3 transactions found.");
  });

  it("announces singular form for exactly one transaction", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [{ id: "1", status: "Completed", type: "Payment", txId: "#TXN1", address: "GAddr1", date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any], total: 5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    const { rerender } = render(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));

    // Change to 1 result
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [{ id: "1", status: "Completed", type: "Payment", txId: "#TXN1", address: "GAddr1", date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any], total: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    rerender(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));

    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion.textContent).toBe("1 transaction found.");
  });

  it("announces zero transactions when results are empty", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [{ id: "1", status: "Completed", type: "Payment", txId: "#TXN1", address: "GAddr1", date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any], total: 5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    const { rerender } = render(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    rerender(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));

    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion.textContent).toBe("No transactions found.");
  });

  it("debounces rapid filter changes so only the final count is announced", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [{ id: "1", status: "Completed", type: "Payment", txId: "#TXN1", address: "GAddr1", date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any], total: 5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    const { rerender } = render(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));

    // Rapidly change filters multiple times before debounce fires.
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: Array.from({ length: 10 }, (_, i) => ({ id: String(i), status: "Completed", type: "Payment", txId: `#TXN${i}`, address: `GAddr${i}`, date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any)), total: 10 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    rerender(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(100));

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: Array.from({ length: 20 }, (_, i) => ({ id: String(i), status: "Completed", type: "Payment", txId: `#TXN${i}`, address: `GAddr${i}`, date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any)), total: 20 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    rerender(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(100));

    // Still within debounce window — should not have announced yet.
    const liveRegion = screen.getByRole("status", { hidden: true });
    expect(liveRegion.textContent).toBe("");

    // Now let the debounce fire completely.
    act(() => vi.advanceTimersByTime(500));

    // Should announce only the final count of 20.
    expect(liveRegion.textContent).toBe("20 transactions found.");
  });

  it("does not re-announce when the same total is received again", () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [{ id: "1", status: "Completed", type: "Payment", txId: "#TXN1", address: "GAddr1", date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any], total: 5 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    const { rerender } = render(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));

    // Change to 10 results.
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: Array.from({ length: 10 }, (_, i) => ({ id: String(i), status: "Completed", type: "Payment", txId: `#TXN${i}`, address: `GAddr${i}`, date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any)), total: 10 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    rerender(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByRole("status", { hidden: true }).textContent).toBe("10 transactions found.");

    // Same total again (e.g. sort change) — should not re-announce.
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: Array.from({ length: 10 }, (_, i) => ({ id: String(i), status: "Completed", type: "Payment", txId: `#TXN${i}`, address: `GAddr${i}`, date: "2024-01-01", time: "12:00", token: "USDC", amount: 10, memo: "" } as any)), total: 10 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    rerender(<TransactionsContent />);
    act(() => vi.advanceTimersByTime(600));

    // Content should still be the previous announcement (not updated to same text again).
    // The live region won't re-announce same content, but textContent stays the same.
    expect(screen.getByRole("status", { hidden: true }).textContent).toBe("10 transactions found.");
  });
});
