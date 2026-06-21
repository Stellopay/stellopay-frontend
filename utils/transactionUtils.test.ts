import { describe, expect, it } from "vitest";

import type { SortField, Transaction } from "@/types/transaction";
import { formatDate } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/formatUtils";
import {
  filterTransactions,
  formatAmount,
  formatTransactionDate,
  getStatusColor,
  sortTransactions,
  TRANSACTION_STATUS_COLOR_CLASSES,
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
});

describe("getStatusColor", () => {
  it("returns exact classes for known statuses, unknown statuses, and mixed case", () => {
    const statusCases = [
      ["completed", TRANSACTION_STATUS_COLOR_CLASSES.completed],
      ["pending", TRANSACTION_STATUS_COLOR_CLASSES.pending],
      ["failed", TRANSACTION_STATUS_COLOR_CLASSES.failed],
      ["unknown", TRANSACTION_STATUS_COLOR_CLASSES.unknown],
      ["CoMpLeTeD", TRANSACTION_STATUS_COLOR_CLASSES.completed],
      ["PeNdInG", TRANSACTION_STATUS_COLOR_CLASSES.pending],
      ["FaIlEd", TRANSACTION_STATUS_COLOR_CLASSES.failed],
    ] as const;

    for (const [status, expectedClassName] of statusCases) {
      expect(getStatusColor(status)).toBe(expectedClassName);
    }
  });

  it("uses a distinct fallback for unexpected statuses and empty strings", () => {
    expect(getStatusColor("reversed")).not.toBe(
      TRANSACTION_STATUS_COLOR_CLASSES.unknown,
    );
    expect(getStatusColor("")).not.toBe(TRANSACTION_STATUS_COLOR_CLASSES.unknown);
  });
});
