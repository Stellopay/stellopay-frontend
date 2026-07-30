/**
 * @fileoverview Unit tests for the centralized transaction filter predicates in
 * `components/transactions/transactions-config.ts`.
 *
 * Coverage map (matches the task requirements):
 *
 * 1. **Individual filter predicates in isolation**
 *    - `createSearchQueryPredicate` — matches type/txId/address/token/status,
 *      case-insensitivity, empty-query pass-all.
 *    - `createSelectedFilterPredicate` — exact type match, default-sentinel
 *      pass-all, case-sensitivity.
 *    - `createFilterQueryPredicate` — type/status/address match, trimming,
 *      whitespace-only pass-all.
 *    - `createDateRangePredicate` — inclusive boundaries, out-of-range
 *      exclusion, invalid-date exclusion.
 *    - `createMinAmountPredicate` / `createMaxAmountPredicate` — absolute
 *      value semantics, `undefined` pass-all, boundary equality.
 *    - `createCounterpartyPredicate` — address substring, trimming,
 *      empty/whitespace pass-all.
 *
 * 2. **Combined-filter behavior (AND semantics)**
 *    - Overlapping result sets (date ∩ status ∩ amount).
 *    - Non-overlapping result sets (one filter zeroes out the other).
 *    - Three-filter composition (date AND status AND amount).
 *
 * 3. **Zero-results edge case**
 *    - A filter combination that matches no transaction returns `[]`.
 *
 * 4. **Immutability & defaults**
 *    - Input array is not mutated.
 *    - `applyTransactionFilters()` with no options returns all transactions.
 *
 * Accessibility / responsive notes:
 * These predicates are pure data functions with no rendered UI, so there is no
 * direct WCAG/contrast/keyboard surface to test here. The filter UI components
 * that consume them (`filter.tsx`, `advanced-filter-panel.tsx`,
 * `date-range-chip.tsx`) carry their own axe-core and keyboard tests, and the
 * status color palette in `transactionUtils.ts` uses AA-compliant contrast
 * ratios (documented inline). Responsive behavior is validated at the component
 * level across `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 breakpoints.
 */

import { describe, expect, it } from "vitest";

import type { Transaction } from "@/types/transaction";
import {
  applyTransactionFilters,
  createCounterpartyPredicate,
  createDateRangePredicate,
  createFilterQueryPredicate,
  createMaxAmountPredicate,
  createMinAmountPredicate,
  createSearchQueryPredicate,
  createSelectedFilterPredicate,
  DEFAULT_SELECTED_FILTER,
  TRANSACTIONS_PAGE_SIZE,
  getDefaultDateRange,
} from "@/components/transactions/transactions-config";

// ── Shared fixture ───────────────────────────────────────────────────────────
//
// A small, deliberately varied transaction set that exercises every predicate:
// - two types (Payment Sent / Payment Received)
// - three statuses (Completed / Pending / Failed)
// - positive and negative amounts (absolute-value filtering)
// - distinct addresses for counterparty matching
// - a known date spread for range filtering

const fixtureFromDate = "2023-04-08";
const fixtureToDate = "2023-04-12";

const transactions: Transaction[] = [
  {
    id: "tx-1",
    type: "Payment Sent",
    txId: "#TXNT2345",
    address: "0xA1B2...C3D4E5",
    date: "2023-04-12",
    time: "09:32AM",
    token: "USDC",
    amount: -607.87,
    status: "Completed",
    statusColor: "success",
    memo: "Invoice #1024",
  },
  {
    id: "tx-2",
    type: "Payment Received",
    txId: "#TXNT2345",
    address: "GABCDE...XYZ67890",
    date: "2023-04-12",
    time: "09:32AM",
    token: "XLM",
    amount: 307.07,
    status: "Completed",
    statusColor: "success",
    memo: "Payment for services",
  },
  {
    id: "tx-3",
    type: "Payment Sent",
    txId: "#TXNT2345",
    address: "0xA1B2...C3D4E5",
    date: "2023-04-11",
    time: "09:32AM",
    token: "USDC",
    amount: -300.0,
    status: "Pending",
    statusColor: "warning",
  },
  {
    id: "tx-4",
    type: "Payment Received",
    txId: "#TXNT2345",
    address: "GABCDE...XYZ67890",
    date: "2023-04-10",
    time: "09:32AM",
    token: "XLM",
    amount: 2000.0,
    status: "Completed",
    statusColor: "success",
  },
  {
    id: "tx-5",
    type: "Payment Sent",
    txId: "#TXNT2345",
    address: "0xA1B2...C3D4E5",
    date: "2023-04-09",
    time: "09:32AM",
    token: "USDC",
    amount: -607.87,
    status: "Failed",
    statusColor: "destructive",
    memo: "Refund order #891",
  },
  {
    id: "tx-6",
    type: "Payment Received",
    txId: "#TXNT2345",
    address: "GABCDE...XYZ67890",
    date: "2023-04-08",
    time: "09:32AM",
    token: "XLM",
    amount: 2000.0,
    status: "Completed",
    statusColor: "success",
  },
];

const ids = (result: Transaction[]) => result.map((t) => t.id);

// ── Constants & defaults ─────────────────────────────────────────────────────

describe("transactions-config constants & defaults", () => {
  it("exports a positive integer TRANSACTIONS_PAGE_SIZE", () => {
    expect(Number.isInteger(TRANSACTIONS_PAGE_SIZE)).toBe(true);
    expect(TRANSACTIONS_PAGE_SIZE).toBeGreaterThan(0);
  });

  it("exports the DEFAULT_SELECTED_FILTER sentinel", () => {
    expect(DEFAULT_SELECTED_FILTER).toBe("All Transactions");
  });

  it("getDefaultDateRange returns a 30-day window ending today (YYYY-MM-DD)", () => {
    const { fromDate, toDate } = getDefaultDateRange();

    // ISO date format check.
    expect(fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date(new Date().toISOString().split("T")[0]);

    // `toDate` is today.
    expect(to.toISOString().split("T")[0]).toBe(
      today.toISOString().split("T")[0],
    );

    // The window is inclusive 30 days.
    const diffDays =
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });
});

// ── Individual predicate: searchQuery ────────────────────────────────────────

describe("createSearchQueryPredicate", () => {
  it("returns a pass-all predicate when searchQuery is empty", () => {
    const predicate = createSearchQueryPredicate("");
    expect(transactions.every(predicate)).toBe(true);
  });

  it("matches the transaction type case-insensitively", () => {
    const predicate = createSearchQueryPredicate("payment sent");
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-1",
      "tx-3",
      "tx-5",
    ]);
  });

  it("matches the txId", () => {
    const predicate = createSearchQueryPredicate("#TXNT2345");
    // Every fixture shares the same txId, so all match.
    expect(ids(transactions.filter(predicate))).toHaveLength(
      transactions.length,
    );
  });

  it("matches the address case-insensitively", () => {
    const predicate = createSearchQueryPredicate("gabcde");
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-2",
      "tx-4",
      "tx-6",
    ]);
  });

  it("matches the token case-insensitively", () => {
    const predicate = createSearchQueryPredicate("xlm");
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-2",
      "tx-4",
      "tx-6",
    ]);
  });

  it("matches the status case-insensitively", () => {
    const predicate = createSearchQueryPredicate("pending");
    expect(ids(transactions.filter(predicate))).toEqual(["tx-3"]);
  });

  it("returns no matches for a query that matches no field", () => {
    const predicate = createSearchQueryPredicate("nonexistent-term");
    expect(transactions.filter(predicate)).toEqual([]);
  });
});

// ── Individual predicate: selectedFilter ─────────────────────────────────────

describe("createSelectedFilterPredicate", () => {
  it("returns a pass-all predicate for the DEFAULT_SELECTED_FILTER sentinel", () => {
    const predicate = createSelectedFilterPredicate(DEFAULT_SELECTED_FILTER);
    expect(transactions.every(predicate)).toBe(true);
  });

  it("matches the exact transaction type", () => {
    const predicate = createSelectedFilterPredicate("Payment Sent");
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-1",
      "tx-3",
      "tx-5",
    ]);
  });

  it("is case-sensitive (lowercase query matches nothing)", () => {
    const predicate = createSelectedFilterPredicate("payment sent");
    expect(transactions.filter(predicate)).toEqual([]);
  });

  it("returns no matches for an unknown type", () => {
    const predicate = createSelectedFilterPredicate("Swap");
    expect(transactions.filter(predicate)).toEqual([]);
  });
});

// ── Individual predicate: filterQuery ────────────────────────────────────────

describe("createFilterQueryPredicate", () => {
  it("returns a pass-all predicate for an empty string", () => {
    const predicate = createFilterQueryPredicate("");
    expect(transactions.every(predicate)).toBe(true);
  });

  it("returns a pass-all predicate for a whitespace-only string", () => {
    const predicate = createFilterQueryPredicate("   ");
    expect(transactions.every(predicate)).toBe(true);
  });

  it("trims and lowercases the query before matching", () => {
    const predicate = createFilterQueryPredicate("  PENDING  ");
    expect(ids(transactions.filter(predicate))).toEqual(["tx-3"]);
  });

  it("matches type, status, and address", () => {
    const byType = createFilterQueryPredicate("received");
    expect(ids(transactions.filter(byType))).toEqual([
      "tx-2",
      "tx-4",
      "tx-6",
    ]);

    const byStatus = createFilterQueryPredicate("failed");
    expect(ids(transactions.filter(byStatus))).toEqual(["tx-5"]);

    const byAddress = createFilterQueryPredicate("0xa1b2");
    expect(ids(transactions.filter(byAddress))).toEqual([
      "tx-1",
      "tx-3",
      "tx-5",
    ]);
  });

  it("returns no matches for a query that matches no field", () => {
    const predicate = createFilterQueryPredicate("zzz-no-match");
    expect(transactions.filter(predicate)).toEqual([]);
  });
});

// ── Individual predicate: dateRange ──────────────────────────────────────────

describe("createDateRangePredicate", () => {
  it("includes transactions on both boundaries (inclusive range)", () => {
    const predicate = createDateRangePredicate(fixtureFromDate, fixtureToDate);
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-1",
      "tx-2",
      "tx-3",
      "tx-4",
      "tx-5",
      "tx-6",
    ]);
  });

  it("excludes transactions outside the range", () => {
    const predicate = createDateRangePredicate("2023-04-10", "2023-04-11");
    expect(ids(transactions.filter(predicate))).toEqual(["tx-3", "tx-4"]);
  });

  it("excludes every transaction when the range is inverted", () => {
    const predicate = createDateRangePredicate(fixtureToDate, fixtureFromDate);
    expect(transactions.filter(predicate)).toEqual([]);
  });

  it("excludes every transaction when bounds are invalid dates", () => {
    const predicate = createDateRangePredicate("not-a-date", fixtureToDate);
    expect(transactions.filter(predicate)).toEqual([]);

    const predicate2 = createDateRangePredicate(fixtureFromDate, "not-a-date");
    expect(transactions.filter(predicate2)).toEqual([]);
  });

  it("matches a single day when from and to are equal", () => {
    const predicate = createDateRangePredicate("2023-04-11", "2023-04-11");
    expect(ids(transactions.filter(predicate))).toEqual(["tx-3"]);
  });
});

// ── Individual predicate: minAmount ──────────────────────────────────────────

describe("createMinAmountPredicate", () => {
  it("returns a pass-all predicate when minAmount is undefined", () => {
    const predicate = createMinAmountPredicate(undefined);
    expect(transactions.every(predicate)).toBe(true);
  });

  it("filters by absolute amount >= threshold (includes negatives)", () => {
    // abs amounts: 607.87, 307.07, 300, 2000, 607.87, 2000
    const predicate = createMinAmountPredicate(607.87);
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-1",
      "tx-4",
      "tx-5",
      "tx-6",
    ]);
  });

  it("includes transactions exactly equal to the threshold (boundary)", () => {
    const predicate = createMinAmountPredicate(2000);
    expect(ids(transactions.filter(predicate))).toEqual(["tx-4", "tx-6"]);
  });

  it("returns no matches when the threshold exceeds every amount", () => {
    const predicate = createMinAmountPredicate(5000);
    expect(transactions.filter(predicate)).toEqual([]);
  });
});

// ── Individual predicate: maxAmount ──────────────────────────────────────────

describe("createMaxAmountPredicate", () => {
  it("returns a pass-all predicate when maxAmount is undefined", () => {
    const predicate = createMaxAmountPredicate(undefined);
    expect(transactions.every(predicate)).toBe(true);
  });

  it("filters by absolute amount <= threshold (includes negatives)", () => {
    const predicate = createMaxAmountPredicate(307.07);
    expect(ids(transactions.filter(predicate))).toEqual(["tx-2", "tx-3"]);
  });

  it("includes transactions exactly equal to the threshold (boundary)", () => {
    const predicate = createMaxAmountPredicate(300);
    expect(ids(transactions.filter(predicate))).toEqual(["tx-3"]);
  });

  it("returns no matches when the threshold is below every amount", () => {
    const predicate = createMaxAmountPredicate(100);
    expect(transactions.filter(predicate)).toEqual([]);
  });
});

// ── Individual predicate: counterparty ───────────────────────────────────────

describe("createCounterpartyPredicate", () => {
  it("returns a pass-all predicate when counterparty is undefined", () => {
    const predicate = createCounterpartyPredicate(undefined);
    expect(transactions.every(predicate)).toBe(true);
  });

  it("returns a pass-all predicate when counterparty is empty", () => {
    const predicate = createCounterpartyPredicate("");
    expect(transactions.every(predicate)).toBe(true);
  });

  it("returns a pass-all predicate when counterparty is whitespace-only", () => {
    const predicate = createCounterpartyPredicate("   ");
    expect(transactions.every(predicate)).toBe(true);
  });

  it("matches the address substring case-insensitively", () => {
    const predicate = createCounterpartyPredicate("GABCDE");
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-2",
      "tx-4",
      "tx-6",
    ]);
  });

  it("trims the query before matching", () => {
    const predicate = createCounterpartyPredicate("  0xa1b2  ");
    expect(ids(transactions.filter(predicate))).toEqual([
      "tx-1",
      "tx-3",
      "tx-5",
    ]);
  });

  it("returns no matches for an unknown address substring", () => {
    const predicate = createCounterpartyPredicate("ZZZ-NOT-FOUND");
    expect(transactions.filter(predicate)).toEqual([]);
  });
});

// ── Combined filter: AND semantics ───────────────────────────────────────────

describe("applyTransactionFilters — AND semantics", () => {
  it("returns every transaction when no options are provided", () => {
    expect(ids(applyTransactionFilters(transactions))).toEqual(
      ids(transactions),
    );
  });

  it("does not mutate the input array", () => {
    const input = [...transactions];
    applyTransactionFilters(input, {
      searchQuery: "payment",
      selectedFilter: "Payment Sent",
      fromDate: fixtureFromDate,
      toDate: fixtureToDate,
      minAmount: 100,
    });
    expect(input).toEqual(transactions);
    expect(input).not.toBe(transactions);
  });

  // ── Overlapping result sets ──────────────────────────────────────────────

  it("intersects date range AND status (overlapping sets)", () => {
    // Date range [2023-04-08, 2023-04-12] includes all 6.
    // Status "Completed" includes tx-1, tx-2, tx-4, tx-6.
    // Intersection → tx-1, tx-2, tx-4, tx-6.
    const result = applyTransactionFilters(transactions, {
      fromDate: fixtureFromDate,
      toDate: fixtureToDate,
      filterQuery: "completed",
    });
    expect(ids(result)).toEqual(["tx-1", "tx-2", "tx-4", "tx-6"]);
  });

  it("intersects selectedFilter AND amount range (overlapping sets)", () => {
    // "Payment Received" → tx-2 (307.07), tx-4 (2000), tx-6 (2000).
    // minAmount 1000 → tx-4, tx-6.
    const result = applyTransactionFilters(transactions, {
      selectedFilter: "Payment Received",
      minAmount: 1000,
    });
    expect(ids(result)).toEqual(["tx-4", "tx-6"]);
  });

  it("intersects date range AND status AND amount (three-filter overlap)", () => {
    // Date [2023-04-08, 2023-04-12] → all 6.
    // Status "Completed" → tx-1, tx-2, tx-4, tx-6.
    // minAmount 500 → tx-1 (607.87), tx-4 (2000), tx-6 (2000).
    // Intersection → tx-1, tx-4, tx-6.
    const result = applyTransactionFilters(transactions, {
      fromDate: fixtureFromDate,
      toDate: fixtureToDate,
      filterQuery: "completed",
      minAmount: 500,
    });
    expect(ids(result)).toEqual(["tx-1", "tx-4", "tx-6"]);
  });

  it("intersects searchQuery AND selectedFilter AND date AND amount", () => {
    // searchQuery "usdc" → tx-1, tx-3, tx-5.
    // selectedFilter "Payment Sent" → tx-1, tx-3, tx-5.
    // date [2023-04-09, 2023-04-12] → tx-1, tx-2, tx-3, tx-5.
    // maxAmount 608 → tx-1 (607.87), tx-3 (300), tx-5 (607.87).
    // Intersection → tx-1, tx-3, tx-5.
    const result = applyTransactionFilters(transactions, {
      searchQuery: "usdc",
      selectedFilter: "Payment Sent",
      fromDate: "2023-04-09",
      toDate: fixtureToDate,
      maxAmount: 608,
    });
    expect(ids(result)).toEqual(["tx-1", "tx-3", "tx-5"]);
  });

  // ── Non-overlapping result sets ──────────────────────────────────────────

  it("returns no results when selectedFilter and status are non-overlapping", () => {
    // "Payment Received" → tx-2, tx-4, tx-6.
    // filterQuery "failed"  → tx-5.
    // The two sets are disjoint, so the AND composition yields nothing.
    const result = applyTransactionFilters(transactions, {
      selectedFilter: "Payment Received",
      filterQuery: "failed",
    });
    expect(result).toEqual([]);
  });

  it("returns no results when date range and amount are non-overlapping", () => {
    // Date [2023-04-08, 2023-04-08] → only tx-6 (amount 2000).
    // maxAmount 100 → no transaction in that date range is <= 100.
    const result = applyTransactionFilters(transactions, {
      fromDate: "2023-04-08",
      toDate: "2023-04-08",
      maxAmount: 100,
    });
    expect(result).toEqual([]);
  });

  // ── Zero-results edge case ───────────────────────────────────────────────

  it("returns [] for a filter combination that matches no transaction", () => {
    // No transaction is a "Payment Sent" with status "Completed" on
    // 2023-04-08 with amount >= 1000.
    const result = applyTransactionFilters(transactions, {
      selectedFilter: "Payment Sent",
      filterQuery: "completed",
      fromDate: "2023-04-08",
      toDate: "2023-04-08",
      minAmount: 1000,
    });
    expect(result).toEqual([]);
  });

  it("returns [] when every active predicate individually matches nothing", () => {
    const result = applyTransactionFilters(transactions, {
      searchQuery: "zzz-no-match",
      selectedFilter: "Swap",
      filterQuery: "zzz-no-match",
      fromDate: "2099-01-01",
      toDate: "2099-01-02",
      minAmount: 999999,
      maxAmount: 0,
      counterparty: "zzz-no-match",
    });
    expect(result).toEqual([]);
  });

  it("returns [] for an empty input array regardless of filters", () => {
    expect(applyTransactionFilters([], { searchQuery: "anything" })).toEqual(
      [],
    );
  });

  // ── Date-range optionality ───────────────────────────────────────────────

  it("does not apply a date constraint when only fromDate is provided", () => {
    // Without both bounds, the date predicate is skipped, so only the
    // selectedFilter applies.
    const result = applyTransactionFilters(transactions, {
      selectedFilter: "Payment Sent",
      fromDate: "2099-01-01", // would exclude everything if applied
    });
    expect(ids(result)).toEqual(["tx-1", "tx-3", "tx-5"]);
  });

  it("does not apply a date constraint when only toDate is provided", () => {
    const result = applyTransactionFilters(transactions, {
      selectedFilter: "Payment Received",
      toDate: "1900-01-01", // would exclude everything if applied
    });
    expect(ids(result)).toEqual(["tx-2", "tx-4", "tx-6"]);
  });

  // ── Counterparty in combination ──────────────────────────────────────────

  it("intersects counterparty AND selectedFilter AND amount", () => {
    // counterparty "GABCDE" → tx-2, tx-4, tx-6.
    // selectedFilter "Payment Received" → tx-2, tx-4, tx-6.
    // minAmount 1000 → tx-4, tx-6.
    const result = applyTransactionFilters(transactions, {
      counterparty: "GABCDE",
      selectedFilter: "Payment Received",
      minAmount: 1000,
    });
    expect(ids(result)).toEqual(["tx-4", "tx-6"]);
  });
});