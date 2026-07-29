import { describe, expect, it } from "vitest";

import type { SortField, SortConfig, Transaction } from "@/types/transaction";
import { formatDate } from "@/utils/date-utils";
import { formatCurrency } from "@/utils/formatUtils";
import {
  filterTransactions,
  formatAmount,
  formatTransactionDate,
  getStatusColor,
  sortTransactions,
  sortTransactionsMulti,
  STATUS_COLOR_PALETTE,
  UNKNOWN_STATUS_COLOR,
} from "@/utils/transactionUtils";

const fixtureStartDate = "2023-03-26";
const fixtureEndDate = "2023-04-15";

const transactions: Transaction[] = [
  {
    id: "boundary-start",
    type: "Payment Sent",
    txId: "TX-MARCH-ALPHA",
    address: "GBOUNDAryStart111111111111111111111111111111111111111111111",
    date: fixtureStartDate,
    time: "08:00 AM",
    token: "USDC",
    amount: -250,
    status: "Completed",
    statusColor: "success",
  },
  {
    id: "march-received",
    type: "Payment Received",
    txId: "tx-march-beta",
    address: "GReceiver2222222222222222222222222222222222222222222222",
    date: "2023-03-27",
    time: "09:15 AM",
    token: "XLM",
    amount: 100,
    status: "Pending",
    statusColor: "warning",
  },
  {
    id: "april-swap",
    type: "Swap",
    txId: "Tx-April-Gamma",
    address: "GSwap3333333333333333333333333333333333333333333333333",
    date: "2023-04-01",
    time: "10:30 AM",
    token: "ETH",
    amount: 1000,
    status: "Failed",
    statusColor: "destructive",
  },
  {
    id: "april-sent",
    type: "Payment Sent",
    txId: "tx-april-delta",
    address: "GStellarDestination4444444444444444444444444444444444444444",
    date: "2023-04-10",
    time: "11:45 AM",
    token: "Stellar",
    amount: -75,
    status: "Completed",
    statusColor: "success",
  },
  {
    id: "boundary-end",
    type: "Deposit",
    txId: "tx-april-epsilon",
    address: "GDeposit55555555555555555555555555555555555555555555555",
    date: fixtureEndDate,
    time: "12:00 PM",
    token: "BTC",
    amount: 25,
    status: "Reversed",
    statusColor: "destructive",
  },
];

describe("formatAmount", () => {
  it("delegates positive and negative amounts to formatCurrency", () => {
    expect(formatAmount(1234.5)).toBe(formatCurrency(1234.5));
    expect(formatAmount(-1234.5)).toBe(formatCurrency(-1234.5));
  });
});

describe("formatTransactionDate", () => {
  it("delegates ISO date formatting to formatDate", () => {
    const isoDate = "2023-04-15T00:00:00";

    expect(formatTransactionDate(isoDate)).toBe(formatDate(isoDate));
  });
});

describe("filterTransactions", () => {
  it("searches type, txId, address, token, and status case-insensitively", () => {
    const searchCases = [
      ["payment sent", ["boundary-start", "april-sent"]],
      ["tx-APRIL-gamma", ["april-swap"]],
      ["gstellarDESTINATION", ["april-sent"]],
      ["usdc", ["boundary-start"]],
      ["completed", ["boundary-start", "april-sent"]],
    ] as const;

    for (const [query, expectedIds] of searchCases) {
      expect(
        filterTransactions(
          transactions,
          query,
          "All Transactions",
          fixtureStartDate,
          fixtureEndDate,
        ).map((transaction) => transaction.id),
      ).toEqual(expectedIds);
    }
  });

  it("keeps every transaction type when selectedFilter is All Transactions", () => {
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        fixtureStartDate,
        fixtureEndDate,
      ).map((transaction) => transaction.id),
    ).toEqual([
      "boundary-start",
      "march-received",
      "april-swap",
      "april-sent",
      "boundary-end",
    ]);
  });

  it("matches non-all filters exactly against transaction type", () => {
    expect(
      filterTransactions(
        transactions,
        "",
        "Payment Sent",
        fixtureStartDate,
        fixtureEndDate,
      ).map((transaction) => transaction.id),
    ).toEqual(["boundary-start", "april-sent"]);
    expect(
      filterTransactions(
        transactions,
        "",
        "payment sent",
        fixtureStartDate,
        fixtureEndDate,
      ).map((transaction) => transaction.id),
    ).toEqual([]);
  });

  it("includes transactions on both date range boundaries", () => {
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        fixtureStartDate,
        fixtureEndDate,
      ).map((transaction) => transaction.id),
    ).toEqual([
      "boundary-start",
      "march-received",
      "april-swap",
      "april-sent",
      "boundary-end",
    ]);
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        "2023-03-27",
        "2023-04-10",
      ).map((transaction) => transaction.id),
    ).toEqual(["march-received", "april-swap", "april-sent"]);
  });

  it("combines search, transaction type, and date filters", () => {
    expect(
      filterTransactions(
        transactions,
        "stellar",
        "Payment Sent",
        "2023-04-01",
        fixtureEndDate,
      ).map((transaction) => transaction.id),
    ).toEqual(["april-sent"]);
  });

  it("excludes every transaction for invalid or empty date ranges", () => {
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        "not-a-date",
        fixtureEndDate,
      ).map((transaction) => transaction.id),
    ).toEqual([]);
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        fixtureStartDate,
        "not-a-date",
      ).map((transaction) => transaction.id),
    ).toEqual([]);
    expect(
      filterTransactions(transactions, "", "All Transactions", "", "").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([]);
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        "",
        fixtureEndDate,
      ).map((transaction) => transaction.id),
    ).toEqual([]);
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        fixtureStartDate,
        "",
      ).map((transaction) => transaction.id),
    ).toEqual([]);
    expect(
      filterTransactions(
        transactions,
        "",
        "All Transactions",
        fixtureEndDate,
        fixtureStartDate,
      ).map((transaction) => transaction.id),
    ).toEqual([]);
  });
});

describe("sortTransactions", () => {
  it("sorts unsorted input by date in ascending and descending order", () => {
    const [boundaryStart, marchReceived, aprilSwap, aprilSent, boundaryEnd] =
      transactions;
    const unsortedTransactions = [
      aprilSwap,
      boundaryEnd,
      boundaryStart,
      aprilSent,
      marchReceived,
    ];

    expect(unsortedTransactions.map((transaction) => transaction.id)).toEqual([
      "april-swap",
      "boundary-end",
      "boundary-start",
      "april-sent",
      "march-received",
    ]);

    expect(
      sortTransactions(unsortedTransactions, "date", "asc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "boundary-start",
      "march-received",
      "april-swap",
      "april-sent",
      "boundary-end",
    ]);
    expect(
      sortTransactions(unsortedTransactions, "date", "desc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "boundary-end",
      "april-sent",
      "april-swap",
      "march-received",
      "boundary-start",
    ]);
  });

  it("sorts by amount magnitude in ascending and descending order", () => {
    expect(
      sortTransactions(transactions, "amount", "asc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "boundary-end",
      "april-sent",
      "march-received",
      "boundary-start",
      "april-swap",
    ]);
    expect(
      sortTransactions(transactions, "amount", "desc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "april-swap",
      "boundary-start",
      "march-received",
      "april-sent",
      "boundary-end",
    ]);
  });

  it("sorts by type in ascending and descending order", () => {
    expect(
      sortTransactions(transactions, "type", "asc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "boundary-end",
      "march-received",
      "boundary-start",
      "april-sent",
      "april-swap",
    ]);
    expect(
      sortTransactions(transactions, "type", "desc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "april-swap",
      "boundary-start",
      "april-sent",
      "march-received",
      "boundary-end",
    ]);
  });

  it("sorts by status in ascending and descending order", () => {
    expect(
      sortTransactions(transactions, "status", "asc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "boundary-start",
      "april-sent",
      "april-swap",
      "march-received",
      "boundary-end",
    ]);
    expect(
      sortTransactions(transactions, "status", "desc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "boundary-end",
      "march-received",
      "april-swap",
      "boundary-start",
      "april-sent",
    ]);
  });

  it("handles invalid dates without throwing during sorting", () => {
    const malformedTransactions: Transaction[] = [
      { ...transactions[0], id: "valid-late", date: "2023-06-01" },
      { ...transactions[1], id: "invalid-date", date: "not-a-date" },
      { ...transactions[2], id: "valid-early", date: "2023-01-01" },
    ];

    expect(() =>
      sortTransactions(malformedTransactions, "date", "asc"),
    ).not.toThrow();
    expect(
      sortTransactions(malformedTransactions, "date", "asc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual(["invalid-date", "valid-early", "valid-late"]);
  });

  it("handles non-finite amounts without throwing during sorting", () => {
    const malformedTransactions: Transaction[] = [
      { ...transactions[0], id: "finite-large", amount: 500 },
      { ...transactions[1], id: "nan-amount", amount: Number.NaN },
      { ...transactions[2], id: "finite-small", amount: -10 },
    ];

    expect(() =>
      sortTransactions(malformedTransactions, "amount", "asc"),
    ).not.toThrow();
    expect(
      sortTransactions(malformedTransactions, "amount", "asc").map(
        (transaction) => transaction.id,
      ),
    ).toEqual(["nan-amount", "finite-small", "finite-large"]);
  });

  it("does not mutate the original transaction array", () => {
    const originalOrder = transactions.map((transaction) => transaction.id);
    const sorted = sortTransactions(transactions, "amount", "asc");

    expect(sorted).not.toBe(transactions);
    expect(transactions.map((transaction) => transaction.id)).toEqual(
      originalOrder,
    );
  });

  it("preserves original order for an unknown sort field", () => {
    const originalOrder = transactions.map((transaction) => transaction.id);
    const sorted = sortTransactions(
      transactions,
      "unsupported" as SortField,
      "asc",
    );

    expect(sorted).not.toBe(transactions);
    expect(sorted.map((transaction) => transaction.id)).toEqual(originalOrder);
  });

  describe("sort stability", () => {
    it("maintains original order for transactions with equal sort keys (date)", () => {
      const sameDate = "2023-04-01";
      const transactionsWithSameDate: Transaction[] = [
        {
          id: "first-same-date",
          type: "Payment Sent",
          txId: "TX-001",
          address: "ADDR1",
          date: sameDate,
          time: "09:00 AM",
          token: "USDC",
          amount: -100,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "second-same-date",
          type: "Payment Received",
          txId: "TX-002",
          address: "ADDR2",
          date: sameDate,
          time: "10:00 AM",
          token: "XLM",
          amount: 200,
          status: "Pending",
          statusColor: "warning",
        },
        {
          id: "third-same-date",
          type: "Swap",
          txId: "TX-003",
          address: "ADDR3",
          date: sameDate,
          time: "11:00 AM",
          token: "ETH",
          amount: 300,
          status: "Failed",
          statusColor: "destructive",
        },
      ];

      const sortedAsc = sortTransactions(transactionsWithSameDate, "date", "asc");
      const sortedDesc = sortTransactions(transactionsWithSameDate, "date", "desc");

      // Since all dates are equal, original order should be preserved
      expect(sortedAsc.map(t => t.id)).toEqual([
        "first-same-date",
        "second-same-date", 
        "third-same-date"
      ]);
      expect(sortedDesc.map(t => t.id)).toEqual([
        "first-same-date",
        "second-same-date",
        "third-same-date"
      ]);
    });

    it("maintains original order for transactions with equal sort keys (amount)", () => {
      const sameAmount = 100;
      const transactionsWithSameAmount: Transaction[] = [
        {
          id: "first-same-amount",
          type: "Payment Sent",
          txId: "TX-001",
          address: "ADDR1", 
          date: "2023-04-01",
          time: "09:00 AM",
          token: "USDC",
          amount: sameAmount,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "second-same-amount",
          type: "Payment Received",
          txId: "TX-002",
          address: "ADDR2",
          date: "2023-04-02",
          time: "10:00 AM", 
          token: "XLM",
          amount: -sameAmount, // Same absolute value
          status: "Pending",
          statusColor: "warning",
        },
        {
          id: "third-same-amount",
          type: "Swap",
          txId: "TX-003",
          address: "ADDR3",
          date: "2023-04-03",
          time: "11:00 AM",
          token: "ETH", 
          amount: sameAmount,
          status: "Failed",
          statusColor: "destructive",
        },
      ];

      const sortedAsc = sortTransactions(transactionsWithSameAmount, "amount", "asc");
      const sortedDesc = sortTransactions(transactionsWithSameAmount, "amount", "desc");

      // All amounts have same absolute value, so original order should be preserved
      expect(sortedAsc.map(t => t.id)).toEqual([
        "first-same-amount",
        "second-same-amount",
        "third-same-amount"
      ]);
      expect(sortedDesc.map(t => t.id)).toEqual([
        "first-same-amount", 
        "second-same-amount",
        "third-same-amount"
      ]);
    });

    it("maintains original order for transactions with equal sort keys (type)", () => {
      const sameType = "Payment Sent";
      const transactionsWithSameType: Transaction[] = [
        {
          id: "first-payment-sent",
          type: sameType,
          txId: "TX-001",
          address: "ADDR1",
          date: "2023-04-01",
          time: "09:00 AM",
          token: "USDC",
          amount: -100,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "second-payment-sent", 
          type: sameType,
          txId: "TX-002",
          address: "ADDR2",
          date: "2023-04-02",
          time: "10:00 AM",
          token: "XLM",
          amount: -200,
          status: "Pending",
          statusColor: "warning",
        },
        {
          id: "third-payment-sent",
          type: sameType,
          txId: "TX-003", 
          address: "ADDR3",
          date: "2023-04-03",
          time: "11:00 AM",
          token: "ETH",
          amount: -300,
          status: "Failed",
          statusColor: "destructive",
        },
      ];

      const sortedAsc = sortTransactions(transactionsWithSameType, "type", "asc");
      const sortedDesc = sortTransactions(transactionsWithSameType, "type", "desc");

      // All types are equal, so original order should be preserved
      expect(sortedAsc.map(t => t.id)).toEqual([
        "first-payment-sent",
        "second-payment-sent",
        "third-payment-sent"
      ]);
      expect(sortedDesc.map(t => t.id)).toEqual([
        "first-payment-sent",
        "second-payment-sent", 
        "third-payment-sent"
      ]);
    });

    it("maintains original order for transactions with equal sort keys (status)", () => {
      const sameStatus = "Completed";
      const transactionsWithSameStatus: Transaction[] = [
        {
          id: "first-completed",
          type: "Payment Sent",
          txId: "TX-001",
          address: "ADDR1",
          date: "2023-04-01", 
          time: "09:00 AM",
          token: "USDC",
          amount: -100,
          status: sameStatus,
          statusColor: "success",
        },
        {
          id: "second-completed",
          type: "Payment Received",
          txId: "TX-002",
          address: "ADDR2",
          date: "2023-04-02",
          time: "10:00 AM",
          token: "XLM",
          amount: 200,
          status: sameStatus,
          statusColor: "success",
        },
        {
          id: "third-completed",
          type: "Swap", 
          txId: "TX-003",
          address: "ADDR3",
          date: "2023-04-03",
          time: "11:00 AM",
          token: "ETH",
          amount: 300,
          status: sameStatus,
          statusColor: "success",
        },
      ];

      const sortedAsc = sortTransactions(transactionsWithSameStatus, "status", "asc");
      const sortedDesc = sortTransactions(transactionsWithSameStatus, "status", "desc");

      // All statuses are equal, so original order should be preserved
      expect(sortedAsc.map(t => t.id)).toEqual([
        "first-completed",
        "second-completed",
        "third-completed"
      ]);
      expect(sortedDesc.map(t => t.id)).toEqual([
        "first-completed",
        "second-completed",
        "third-completed"
      ]);
    });
  });

  describe("null and undefined value handling", () => {
    it("handles null and undefined date values by placing them first (as invalid dates)", () => {
      const transactionsWithNullDates: Transaction[] = [
        {
          id: "valid-date",
          type: "Payment Sent",
          txId: "TX-001",
          address: "ADDR1",
          date: "2023-04-15",
          time: "09:00 AM",
          token: "USDC",
          amount: -100,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "null-date",
          type: "Payment Received", 
          txId: "TX-002",
          address: "ADDR2",
          date: null as any, // Force null date
          time: "10:00 AM",
          token: "XLM",
          amount: 200,
          status: "Pending",
          statusColor: "warning",
        },
        {
          id: "undefined-date",
          type: "Swap",
          txId: "TX-003",
          address: "ADDR3",
          date: undefined as any, // Force undefined date
          time: "11:00 AM", 
          token: "ETH",
          amount: 300,
          status: "Failed",
          statusColor: "destructive",
        },
        {
          id: "another-valid-date",
          type: "Deposit",
          txId: "TX-004",
          address: "ADDR4",
          date: "2023-04-10",
          time: "12:00 PM",
          token: "BTC",
          amount: 400,
          status: "Completed",
          statusColor: "success",
        },
      ];

      const sortedAsc = sortTransactions(transactionsWithNullDates, "date", "asc");
      const sortedDesc = sortTransactions(transactionsWithNullDates, "date", "desc");

      // Null/undefined dates (normalized to epoch) should come first in asc order
      expect(sortedAsc.map(t => t.id)).toEqual([
        "null-date",
        "undefined-date", 
        "another-valid-date",
        "valid-date"
      ]);

      // In desc order, null/undefined dates should come last
      expect(sortedDesc.map(t => t.id)).toEqual([
        "valid-date",
        "another-valid-date",
        "null-date",
        "undefined-date"
      ]);
    });

    it("handles null and undefined amount values by normalizing to zero", () => {
      const transactionsWithNullAmounts: Transaction[] = [
        {
          id: "positive-amount",
          type: "Payment Received",
          txId: "TX-001",
          address: "ADDR1",
          date: "2023-04-01",
          time: "09:00 AM",
          token: "USDC",
          amount: 100,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "null-amount",
          type: "Payment Sent",
          txId: "TX-002", 
          address: "ADDR2",
          date: "2023-04-02",
          time: "10:00 AM",
          token: "XLM", 
          amount: null as any, // Force null amount
          status: "Pending",
          statusColor: "warning",
        },
        {
          id: "undefined-amount",
          type: "Swap",
          txId: "TX-003",
          address: "ADDR3",
          date: "2023-04-03",
          time: "11:00 AM",
          token: "ETH",
          amount: undefined as any, // Force undefined amount
          status: "Failed", 
          statusColor: "destructive",
        },
        {
          id: "negative-amount",
          type: "Payment Sent", 
          txId: "TX-004",
          address: "ADDR4",
          date: "2023-04-04",
          time: "12:00 PM",
          token: "BTC",
          amount: -50,
          status: "Completed",
          statusColor: "success",
        },
      ];

      const sortedAsc = sortTransactions(transactionsWithNullAmounts, "amount", "asc");
      const sortedDesc = sortTransactions(transactionsWithNullAmounts, "amount", "desc");

      // Null/undefined amounts (normalized to 0) should be between negative and positive
      expect(sortedAsc.map(t => t.id)).toEqual([
        "null-amount",
        "undefined-amount", 
        "negative-amount", // abs(-50) = 50
        "positive-amount" // abs(100) = 100
      ]);

      expect(sortedDesc.map(t => t.id)).toEqual([
        "positive-amount", // abs(100) = 100
        "negative-amount", // abs(-50) = 50
        "null-amount",
        "undefined-amount"
      ]);
    });

    it("handles null and undefined string values (type, status) predictably", () => {
      const transactionsWithNullStrings: Transaction[] = [
        {
          id: "valid-type-status",
          type: "Payment Sent",
          txId: "TX-001", 
          address: "ADDR1",
          date: "2023-04-01",
          time: "09:00 AM",
          token: "USDC",
          amount: -100,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "null-type",
          type: null as any, // Force null type
          txId: "TX-002",
          address: "ADDR2", 
          date: "2023-04-02",
          time: "10:00 AM",
          token: "XLM",
          amount: 200,
          status: "Pending",
          statusColor: "warning",
        },
        {
          id: "undefined-status",
          type: "Swap",
          txId: "TX-003",
          address: "ADDR3",
          date: "2023-04-03",
          time: "11:00 AM",
          token: "ETH",
          amount: 300,
          status: undefined as any, // Force undefined status
          statusColor: "destructive",
        },
      ];

      // Should handle null/undefined string values without throwing
      expect(() => sortTransactions(transactionsWithNullStrings, "type", "asc")).not.toThrow();
      expect(() => sortTransactions(transactionsWithNullStrings, "type", "desc")).not.toThrow();
      expect(() => sortTransactions(transactionsWithNullStrings, "status", "asc")).not.toThrow();
      expect(() => sortTransactions(transactionsWithNullStrings, "status", "desc")).not.toThrow();

      const sortedByType = sortTransactions(transactionsWithNullStrings, "type", "asc");
      const sortedByStatus = sortTransactions(transactionsWithNullStrings, "status", "asc");

      // Verify that sorting completes and produces some order (exact order may vary based on JS string comparison of null/undefined)
      expect(sortedByType).toHaveLength(3);
      expect(sortedByStatus).toHaveLength(3);
      expect(sortedByType.map(t => t.id)).toContain("valid-type-status");
      expect(sortedByType.map(t => t.id)).toContain("null-type"); 
      expect(sortedByType.map(t => t.id)).toContain("undefined-status");
    });
  });

  describe("edge cases and comprehensive coverage", () => {
    it("handles empty transaction arrays", () => {
      const emptyArray: Transaction[] = [];
      
      expect(sortTransactions(emptyArray, "date", "asc")).toEqual([]);
      expect(sortTransactions(emptyArray, "amount", "desc")).toEqual([]);
      expect(sortTransactions(emptyArray, "type", "asc")).toEqual([]);
      expect(sortTransactions(emptyArray, "status", "desc")).toEqual([]);
    });

    it("handles single-item transaction arrays", () => {
      const singleTransaction: Transaction[] = [transactions[0]];
      
      expect(sortTransactions(singleTransaction, "date", "asc")).toEqual(singleTransaction);
      expect(sortTransactions(singleTransaction, "amount", "desc")).toEqual(singleTransaction);
      expect(sortTransactions(singleTransaction, "type", "asc")).toEqual(singleTransaction);
      expect(sortTransactions(singleTransaction, "status", "desc")).toEqual(singleTransaction);
      
      // Verify it doesn't mutate the original
      expect(sortTransactions(singleTransaction, "date", "asc")).not.toBe(singleTransaction);
    });

    it("handles extreme date values", () => {
      const extremeDateTransactions: Transaction[] = [
        {
          id: "far-future",
          type: "Payment Sent",
          txId: "TX-001", 
          address: "ADDR1",
          date: "2099-12-31", // Far future
          time: "23:59 PM",
          token: "USDC",
          amount: -100,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "far-past",
          type: "Payment Received",
          txId: "TX-002",
          address: "ADDR2",
          date: "1900-01-01", // Far past
          time: "00:01 AM",
          token: "XLM", 
          amount: 200,
          status: "Pending",
          statusColor: "warning",
        },
      ];

      const sortedAsc = sortTransactions(extremeDateTransactions, "date", "asc");
      const sortedDesc = sortTransactions(extremeDateTransactions, "date", "desc");

      expect(sortedAsc.map(t => t.id)).toEqual(["far-past", "far-future"]);
      expect(sortedDesc.map(t => t.id)).toEqual(["far-future", "far-past"]);
    });

    it("handles extreme amount values", () => {
      const extremeAmountTransactions: Transaction[] = [
        {
          id: "large-positive",
          type: "Payment Received",
          txId: "TX-001",
          address: "ADDR1",
          date: "2023-04-01",
          time: "09:00 AM",
          token: "USDC", 
          amount: 1000000, // Large positive
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "large-negative",
          type: "Payment Sent",
          txId: "TX-002",
          address: "ADDR2",
          date: "2023-04-02",
          time: "10:00 AM",
          token: "XLM",
          amount: -999999, // Large negative (different absolute value)
          status: "Pending",
          statusColor: "warning", 
        },
        {
          id: "zero-amount",
          type: "Swap",
          txId: "TX-003",
          address: "ADDR3", 
          date: "2023-04-03",
          time: "11:00 AM",
          token: "ETH",
          amount: 0,
          status: "Failed",
          statusColor: "destructive",
        },
      ];

      const sortedAsc = sortTransactions(extremeAmountTransactions, "amount", "asc");
      const sortedDesc = sortTransactions(extremeAmountTransactions, "amount", "desc");

      // Amount sorting uses absolute values
      expect(sortedAsc.map(t => t.id)).toEqual([
        "zero-amount", // abs(0) = 0
        "large-negative", // abs(-999999) = 999999
        "large-positive" // abs(1000000) = 1000000
      ]);
      expect(sortedDesc.map(t => t.id)).toEqual([
        "large-positive", // abs(1000000) = 1000000 (largest)
        "large-negative", // abs(-999999) = 999999
        "zero-amount" // abs(0) = 0 (smallest)
      ]);
    });

    it("handles special float values (Infinity, -Infinity)", () => {
      const specialFloatTransactions: Transaction[] = [
        {
          id: "positive-infinity",
          type: "Payment Received",
          txId: "TX-001",
          address: "ADDR1",
          date: "2023-04-01",
          time: "09:00 AM", 
          token: "USDC",
          amount: Number.POSITIVE_INFINITY,
          status: "Completed",
          statusColor: "success",
        },
        {
          id: "negative-infinity",
          type: "Payment Sent", 
          txId: "TX-002",
          address: "ADDR2",
          date: "2023-04-02",
          time: "10:00 AM",
          token: "XLM",
          amount: Number.NEGATIVE_INFINITY,
          status: "Pending",
          statusColor: "warning",
        },
        {
          id: "normal-amount",
          type: "Swap",
          txId: "TX-003",
          address: "ADDR3",
          date: "2023-04-03",
          time: "11:00 AM",
          token: "ETH",
          amount: 100,
          status: "Failed",
          statusColor: "destructive",
        },
      ];

      // Should handle infinite values without throwing
      expect(() => sortTransactions(specialFloatTransactions, "amount", "asc")).not.toThrow();
      expect(() => sortTransactions(specialFloatTransactions, "amount", "desc")).not.toThrow();

      const sortedAsc = sortTransactions(specialFloatTransactions, "amount", "asc");
      const sortedDesc = sortTransactions(specialFloatTransactions, "amount", "desc");

      // Verify sorting completes
      expect(sortedAsc).toHaveLength(3);
      expect(sortedDesc).toHaveLength(3);
    });

    it("verifies consistent behavior across multiple sort operations", () => {
      // Test that multiple sorts on the same data produce consistent results
      const testTransactions = [...transactions];
      
      const sort1 = sortTransactions(testTransactions, "date", "asc");
      const sort2 = sortTransactions(testTransactions, "date", "asc");
      const sort3 = sortTransactions(sort1, "date", "asc");

      expect(sort1.map(t => t.id)).toEqual(sort2.map(t => t.id));
      expect(sort1.map(t => t.id)).toEqual(sort3.map(t => t.id));

      // Verify original array unchanged
      expect(testTransactions).toEqual(transactions);
    });
  });
});

describe("sortTransactionsMulti", () => {
  it("returns a copy of the array unchanged when sortConfigs is empty", () => {
    const result = sortTransactionsMulti(transactions, []);
    expect(result).not.toBe(transactions);
    expect(result.map((t) => t.id)).toEqual(transactions.map((t) => t.id));
  });

  it("sorts by a single config identically to sortTransactions", () => {
    const singleConfig: SortConfig[] = [
      { field: "amount", direction: "desc" },
    ];
    const multiResult = sortTransactionsMulti(transactions, singleConfig);
    const singleResult = sortTransactions(transactions, "amount", "desc");
    expect(multiResult.map((t) => t.id)).toEqual(
      singleResult.map((t) => t.id),
    );
  });

  it("applies secondary sort as a tiebreaker when primary values are equal", () => {
    // Three transactions with same status but different amounts and dates.
    // Primary sort: status asc. Secondary sort: amount asc (tiebreaker).
    const tiebreakerTestData: Transaction[] = [
      {
        ...transactions[0],
        id: "completed-1",
        status: "Completed",
        amount: -250,
        date: "2023-04-01",
      },
      {
        ...transactions[1],
        id: "completed-2",
        status: "Completed",
        amount: -100,
        date: "2023-03-01",
      },
      {
        ...transactions[2],
        id: "pending-1",
        status: "Pending",
        amount: -500,
        date: "2023-05-01",
      },
    ];

    const configs: SortConfig[] = [
      { field: "status", direction: "asc" },
      { field: "amount", direction: "asc" },
    ];

    const sorted = sortTransactionsMulti(tiebreakerTestData, configs);
    const ids = sorted.map((t) => t.id);

    // Within "Completed" group: completed-1 (-250) comes before completed-2 (-100) by amount asc
    // Then "Pending" group
    expect(ids).toEqual(["completed-1", "completed-2", "pending-1"]);
  });

  it("uses secondary sort descending correctly", () => {
    const tiebreakerTestData: Transaction[] = [
      {
        ...transactions[0],
        id: "completed-1",
        status: "Completed",
        amount: 100,
        date: "2023-04-01",
      },
      {
        ...transactions[1],
        id: "completed-2",
        status: "Completed",
        amount: 200,
        date: "2023-03-01",
      },
    ];

    // Primary: status asc, Secondary: amount desc (larger amounts first)
    const configs: SortConfig[] = [
      { field: "status", direction: "asc" },
      { field: "amount", direction: "desc" },
    ];

    const sorted = sortTransactionsMulti(tiebreakerTestData, configs);
    expect(sorted[0]!.id).toBe("completed-2");
    expect(sorted[1]!.id).toBe("completed-1");
  });

  it("handles three-level sort gracefully", () => {
    const multiLevelData: Transaction[] = [
      {
        ...transactions[0],
        id: "a",
        status: "Completed",
        amount: 100,
        date: "2023-01-01",
      },
      {
        ...transactions[1],
        id: "b",
        status: "Completed",
        amount: 100,
        date: "2023-02-01",
      },
      {
        ...transactions[2],
        id: "c",
        status: "Completed",
        amount: 200,
        date: "2023-03-01",
      },
    ];

    // status asc → amount asc → date asc
    const configs: SortConfig[] = [
      { field: "status", direction: "asc" },
      { field: "amount", direction: "asc" },
      { field: "date", direction: "asc" },
    ];

    const sorted = sortTransactionsMulti(multiLevelData, configs);
    // Both "a" and "b" have amount=100, so date asc: a (Jan 1) before b (Feb 1)
    expect(sorted.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the original array", () => {
    const originalOrder = transactions.map((t) => t.id);
    const configs: SortConfig[] = [
      { field: "date", direction: "asc" },
      { field: "amount", direction: "desc" },
    ];
    const result = sortTransactionsMulti(transactions, configs);
    expect(result).not.toBe(transactions);
    expect(transactions.map((t) => t.id)).toEqual(originalOrder);
  });

  it("handles invalid date gracefully in multi-column sort", () => {
    const malformed: Transaction[] = [
      { ...transactions[0], id: "a", date: "not-a-date" },
      { ...transactions[1], id: "b", date: "2023-06-01" },
    ];
    const configs: SortConfig[] = [
      { field: "date", direction: "asc" },
      { field: "type", direction: "asc" },
    ];
    expect(() => sortTransactionsMulti(malformed, configs)).not.toThrow();
  });
});

describe("getStatusColor", () => {
  it("returns the exact palette class for each known status", () => {
    expect(getStatusColor("completed")).toBe(STATUS_COLOR_PALETTE.completed);
    expect(getStatusColor("pending")).toBe(STATUS_COLOR_PALETTE.pending);
    expect(getStatusColor("failed")).toBe(STATUS_COLOR_PALETTE.failed);

    expect(getStatusColor("completed")).toBe("bg-[#102B19] text-[#34D399]");
    expect(getStatusColor("pending")).toBe("bg-[#191919] text-[#FBBF24]");
    expect(getStatusColor("failed")).toBe("bg-[#1A1A1A] text-[#F87171]");
  });

  it("is case-insensitive for known statuses", () => {
    expect(getStatusColor("CoMpLeTeD")).toBe(STATUS_COLOR_PALETTE.completed);
    expect(getStatusColor("PeNdInG")).toBe(STATUS_COLOR_PALETTE.pending);
    expect(getStatusColor("FaIlEd")).toBe(STATUS_COLOR_PALETTE.failed);
  });

  it("falls back to the distinct unknown-status style for unrecognized statuses", () => {
    expect(getStatusColor("unknown")).toBe(UNKNOWN_STATUS_COLOR);
    expect(getStatusColor("reversed")).toBe(UNKNOWN_STATUS_COLOR);
    expect(getStatusColor("")).toBe(UNKNOWN_STATUS_COLOR);
  });

  it("never returns the unknown style for a known status, and vice versa", () => {
    const knownClassNames = Object.values(STATUS_COLOR_PALETTE);

    expect(knownClassNames).not.toContain(UNKNOWN_STATUS_COLOR);
    for (const className of knownClassNames) {
      expect(getStatusColor("not-a-real-status")).not.toBe(className);
    }
  });

  it("never interpolates the raw status string into the returned class name", () => {
    const maliciousStatus = '"><script>alert(1)</script>';

    expect(getStatusColor(maliciousStatus)).toBe(UNKNOWN_STATUS_COLOR);
    expect(getStatusColor(maliciousStatus)).not.toContain(maliciousStatus);
  });
});
