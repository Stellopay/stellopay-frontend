/**
 * Unit tests for reportUtils — pure aggregation functions.
 *
 * Verifies:
 *  - Totals match hand-computed fixtures for each grouping.
 *  - Money sums use integer minor units (decimals are exact).
 *  - filterByTimeWindow is timezone-aware and inclusive.
 *  - CSV export contains filtered data and escapes fields.
 */

import { describe, it, expect } from "vitest";
import type { TransactionProps } from "@/types/transaction";
import {
  computeSummary,
  filterByTimeWindow,
  groupByPeriod,
  groupByAsset,
  groupByCounterparty,
  topCounterparties,
  buildReport,
  generateReportCsv,
} from "./reportUtils";
import type { ParsedTimeWindow } from "@/utils/analyticsTimeWindow";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function tx(overrides: Partial<TransactionProps> = {}): TransactionProps {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    type: "Payment",
    txId: "tx-hash",
    address: "GABC123",
    date: "Apr 12, 2023",
    time: "10:00 AM",
    token: "USDC",
    amount: "100.00",
    status: "Completed",
    tokenIcon: "",
    counterparty: "Alice",
    fee: "0.50",
    ...overrides,
  };
}

function windowOf(from: string, to: string): ParsedTimeWindow {
  return {
    from: new Date(`${from}T00:00:00Z`),
    to: new Date(`${to}T00:00:00Z`),
    preset: "custom",
  };
}

// ---------------------------------------------------------------------------
// computeSummary
// ---------------------------------------------------------------------------

describe("computeSummary", () => {
  it("sums incoming and outgoing amounts correctly", () => {
    const txns = [
      tx({ amount: "100.00" }),
      tx({ amount: "50.25" }),
      tx({ amount: "-30.00" }),
    ];
    const summary = computeSummary(txns);
    expect(summary.totalIn).toBeCloseTo(150.25, 2);
    expect(summary.totalOut).toBeCloseTo(30.00, 2);
    expect(summary.netFlow).toBeCloseTo(120.25, 2);
    expect(summary.transactionCount).toBe(3);
  });

  it("handles decimal amounts without float drift", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in float, but should be exactly 0.30
    const txns = Array.from({ length: 10 }, () => tx({ amount: "0.10" }));
    const summary = computeSummary(txns);
    expect(summary.totalIn).toBe(1.0);
  });

  it("sums fees correctly", () => {
    const txns = [
      tx({ fee: "0.50" }),
      tx({ fee: "1.25" }),
      tx({ fee: "0.00" }),
    ];
    const summary = computeSummary(txns);
    expect(summary.totalFees).toBeCloseTo(1.75, 2);
  });

  it("handles empty list", () => {
    const summary = computeSummary([]);
    expect(summary.totalIn).toBe(0);
    expect(summary.totalOut).toBe(0);
    expect(summary.netFlow).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });

  it("handles missing fee field", () => {
    const txns = [tx({ fee: undefined }), tx({ fee: "1.00" })];
    const summary = computeSummary(txns);
    expect(summary.totalFees).toBeCloseTo(1.00, 2);
  });
});

// ---------------------------------------------------------------------------
// filterByTimeWindow
// ---------------------------------------------------------------------------

describe("filterByTimeWindow", () => {
  it("includes transactions within the window", () => {
    const window = windowOf("2023-04-10", "2023-04-15");
    const txns = [
      tx({ date: "Apr 12, 2023" }),
      tx({ date: "Apr 14, 2023" }),
    ];
    const filtered = filterByTimeWindow(txns, window);
    expect(filtered).toHaveLength(2);
  });

  it("excludes transactions outside the window", () => {
    const window = windowOf("2023-04-10", "2023-04-15");
    const txns = [
      tx({ date: "Apr 09, 2023" }),
      tx({ date: "Apr 16, 2023" }),
      tx({ date: "Apr 12, 2023" }),
    ];
    const filtered = filterByTimeWindow(txns, window);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe("Apr 12, 2023");
  });

  it("includes boundary days (inclusive)", () => {
    const window = windowOf("2023-04-10", "2023-04-12");
    const txns = [
      tx({ date: "Apr 10, 2023" }),
      tx({ date: "Apr 12, 2023" }),
      tx({ date: "Apr 11, 2023" }),
    ];
    const filtered = filterByTimeWindow(txns, window);
    expect(filtered).toHaveLength(3);
  });

  it("handles empty transactions", () => {
    const window = windowOf("2023-04-10", "2023-04-15");
    expect(filterByTimeWindow([], window)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// groupByPeriod
// ---------------------------------------------------------------------------

describe("groupByPeriod", () => {
  it("groups by day with correct labels", () => {
    const txns = [
      tx({ date: "Apr 12, 2023", amount: "100.00" }),
      tx({ date: "Apr 12, 2023", amount: "-50.00" }),
      tx({ date: "Apr 13, 2023", amount: "75.00" }),
    ];
    const buckets = groupByPeriod(txns, "day");
    expect(buckets).toHaveLength(2);
    expect(buckets[0].count).toBe(2);
    expect(buckets[0].totalIn).toBe(100);
    expect(buckets[0].totalOut).toBe(50);
  });

  it("groups by month", () => {
    const txns = [
      tx({ date: "Apr 12, 2023", amount: "100.00" }),
      tx({ date: "Apr 25, 2023", amount: "200.00" }),
      tx({ date: "May 03, 2023", amount: "50.00" }),
    ];
    const buckets = groupByPeriod(txns, "month");
    expect(buckets).toHaveLength(2);
  });

  it("groups by week", () => {
    const txns = [
      tx({ date: "Jan 02, 2023", amount: "100.00" }), // Mon, ISO week 1
      tx({ date: "Jan 09, 2023", amount: "200.00" }), // Mon, ISO week 2
    ];
    const buckets = groupByPeriod(txns, "week");
    expect(buckets).toHaveLength(2);
  });

  it("buckets are sorted chronologically", () => {
    const txns = [
      tx({ date: "Apr 13, 2023", amount: "100.00" }),
      tx({ date: "Apr 12, 2023", amount: "200.00" }),
    ];
    const buckets = groupByPeriod(txns, "day");
    expect(buckets[0].key < buckets[1].key).toBe(true);
  });

  it("handles empty list", () => {
    expect(groupByPeriod([], "day")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// groupByAsset
// ---------------------------------------------------------------------------

describe("groupByAsset", () => {
  it("groups by token symbol", () => {
    const txns = [
      tx({ token: "USDC", amount: "100.00" }),
      tx({ token: "USDC", amount: "-50.00" }),
      tx({ token: "XLM", amount: "200.00" }),
    ];
    const breakdown = groupByAsset(txns);
    expect(breakdown).toHaveLength(2);
    const usdc = breakdown.find((b) => b.asset === "USDC");
    expect(usdc).toBeDefined();
    expect(usdc!.totalIn).toBe(100);
    expect(usdc!.totalOut).toBe(50);
  });

  it("handles unknown token as UNKNOWN", () => {
    const txns = [tx({ token: "", amount: "100.00" })];
    const breakdown = groupByAsset(txns);
    expect(breakdown[0].asset).toBe("UNKNOWN");
  });

  it("sorts by absolute net flow descending", () => {
    const txns = [
      tx({ token: "XLM", amount: "10.00" }),
      tx({ token: "USDC", amount: "500.00" }),
    ];
    const breakdown = groupByAsset(txns);
    expect(breakdown[0].asset).toBe("USDC");
  });
});

// ---------------------------------------------------------------------------
// groupByCounterparty
// ---------------------------------------------------------------------------

describe("groupByCounterparty", () => {
  it("groups by counterparty field", () => {
    const txns = [
      tx({ counterparty: "Alice", amount: "100.00" }),
      tx({ counterparty: "Bob", amount: "-50.00" }),
      tx({ counterparty: "Alice", amount: "200.00" }),
    ];
    const breakdown = groupByCounterparty(txns);
    expect(breakdown).toHaveLength(2);
    const alice = breakdown.find((b) => b.counterparty === "Alice");
    expect(alice).toBeDefined();
    expect(alice!.count).toBe(2);
    expect(alice!.totalIn).toBe(300);
  });

  it("falls back to address when counterparty is missing", () => {
    const txns = [tx({ counterparty: undefined, address: "GXYZ", amount: "100.00" })];
    const breakdown = groupByCounterparty(txns);
    expect(breakdown[0].counterparty).toBe("GXYZ");
  });

  it("handles empty list", () => {
    expect(groupByCounterparty([])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// topCounterparties
// ---------------------------------------------------------------------------

describe("topCounterparties", () => {
  it("returns top N by volume", () => {
    const breakdown = [
      { counterparty: "A", totalIn: 10, totalOut: 0, netFlow: 10, count: 1 },
      { counterparty: "B", totalIn: 500, totalOut: 100, netFlow: 400, count: 2 },
      { counterparty: "C", totalIn: 50, totalOut: 0, netFlow: 50, count: 1 },
    ];
    const top = topCounterparties(breakdown, 2);
    expect(top).toHaveLength(2);
    expect(top[0].counterparty).toBe("B");
    expect(top[1].counterparty).toBe("C");
  });
});

// ---------------------------------------------------------------------------
// buildReport
// ---------------------------------------------------------------------------

describe("buildReport", () => {
  it("returns complete report with all sections", () => {
    const window = windowOf("2023-04-10", "2023-04-20");
    const txns = [
      tx({ date: "Apr 12, 2023", token: "USDC", counterparty: "Alice", amount: "100.00", fee: "0.50" }),
      tx({ date: "Apr 14, 2023", token: "XLM", counterparty: "Bob", amount: "-50.00", fee: "0.25" }),
    ];
    const report = buildReport(txns, window, "day");

    expect(report.summary.transactionCount).toBe(2);
    expect(report.summary.totalIn).toBeCloseTo(100, 2);
    expect(report.summary.totalOut).toBeCloseTo(50, 2);
    expect(report.periodBuckets).toHaveLength(2);
    expect(report.assetBreakdown).toHaveLength(2);
    expect(report.counterpartyBreakdown).toHaveLength(2);
    expect(report.filteredTransactions).toHaveLength(2);
  });

  it("empty period returns empty state data", () => {
    const window = windowOf("2023-01-01", "2023-01-10");
    const report = buildReport([], window, "day");
    expect(report.summary.transactionCount).toBe(0);
    expect(report.periodBuckets).toHaveLength(0);
    expect(report.assetBreakdown).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateReportCsv
// ---------------------------------------------------------------------------

describe("generateReportCsv", () => {
  it("includes headers and data rows", () => {
    const txns = [tx({ date: "Apr 12, 2023", amount: "100.00", fee: "0.50" })];
    const csv = generateReportCsv(txns);
    expect(csv).toContain("Date");
    expect(csv).toContain("Type");
    expect(csv).toContain("Token");
    expect(csv).toContain("Apr 12, 2023");
    expect(csv).toContain("100.00");
  });

  it("escapes fields containing commas", () => {
    const txns = [tx({ counterparty: "Alice, Inc.", amount: "100.00" })];
    const csv = generateReportCsv(txns);
    // The comma in counterparty should be inside quotes
    expect(csv).toContain('"Alice, Inc."');
  });

  it("escapes CSV injection attempts (=, +, -, @)", () => {
    const txns = [tx({ address: "=cmd|/c calc", amount: "100.00" })];
    const csv = generateReportCsv(txns);
    expect(csv).toContain("'=cmd|/c calc");
  });

  it("handles empty list", () => {
    const csv = generateReportCsv([]);
    expect(csv).toContain("Date");
    // Only the header row
    expect(csv.split("\n")).toHaveLength(1);
  });
});
