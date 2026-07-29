import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transaction";
import { createStatementSummary } from "./transactions-statement";

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: "id",
  type: "Payment",
  txId: "tx",
  address: "address",
  date: "Jan 01, 2024",
  time: "10:00",
  token: "USDC",
  amount: 0,
  status: "Completed",
  statusColor: "success",
  ...overrides,
});

describe("createStatementSummary", () => {
  it("calculates opening/closing balances and category totals with inclusive dates", () => {
    const summary = createStatementSummary(
      [
        transaction({ date: "Jan 01, 2024", amount: 100, type: "Funding" }),
        transaction({ date: "Jan 10, 2024", amount: -25, type: "Payment" }),
        transaction({ date: "Jan 31, 2024", amount: 10, type: "Funding" }),
        transaction({ date: "Feb 01, 2024", amount: 500, type: "Funding" }),
      ],
      "2024-01-10",
      "2024-01-31",
    );

    expect(summary).toMatchObject({
      openingBalance: 100,
      moneyIn: 10,
      moneyOut: -25,
      closingBalance: 85,
      transactionCount: 2,
    });
    expect(summary.categories).toEqual([
      { category: "Funding", total: 10, count: 1 },
      { category: "Payment", total: -25, count: 1 },
    ]);
  });

  it("returns a valid zero-activity statement", () => {
    const summary = createStatementSummary([], "2024-01-01", "2024-01-31");
    expect(summary.categories).toEqual([]);
    expect(summary.closingBalance).toBe(0);
  });
});
