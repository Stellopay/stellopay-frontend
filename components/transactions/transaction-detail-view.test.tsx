import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { vi } from "vitest";

import { TransactionDetailView } from "./transaction-detail-view";

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    status: "success",
    profile: { timezone: "America/Los_Angeles" },
  }),
}));

vi.mock("@/hooks/useTransactionTags", () => ({
  useTransactionTags: () => ({
    allTags: [],
    getTagsForTransaction: () => [],
  }),
}));

const transaction = {
  id: "1",
  type: "Payment Sent",
  txId: "hash-123",
  address: "GDESTINATION",
  date: "2026-01-01",
  time: "10:00",
  token: "XLM",
  amount: -25.5,
  status: "Completed",
  statusColor: "success" as const,
  memo: "Invoice 42",
  fee: "0.01 XLM",
  counterparty: "Ada Lovelace",
  hash: "stellar-hash-123",
  tags: ["Payroll"],
};

describe("TransactionDetailView", () => {
  it("renders transaction details and the receipt download action", () => {
    render(<TransactionDetailView transaction={transaction} />);

    expect(
      screen.getByRole("heading", { name: "Transaction #1" }),
    ).toBeVisible();
    expect(screen.getByText("−25.50 XLM")).toBeVisible();
    expect(screen.getByText("Ada Lovelace")).toBeVisible();
    expect(screen.getByText("stellar-hash-123")).toBeVisible();
    expect(screen.getByText("0.01 XLM")).toBeVisible();
    expect(screen.getByText("Invoice 42")).toBeVisible();
    expect(screen.getByText("Payroll")).toBeVisible();
    expect(screen.getByText(/January 1, 2026 at 2:00:00 AM/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /download pdf receipt/i }),
    ).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <TransactionDetailView transaction={transaction} />,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
