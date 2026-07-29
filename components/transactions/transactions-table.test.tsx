import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransactionsTable } from "./transactions-table";

const mockTransactions = [
  {
    id: "1",
    type: "Deposit",
    txId: "TX123",
    address: "0x1234567890abcdef1234567890abcdef1234567890abcdef", // Very long address
    date: "2023-10-27",
    time: "10:00 AM",
    token: "ETH",
    amount: "+1000000000000000000000000000.00", // Very long amount
    status: "Completed" as const,
    tokenIcon: "/icons/eth.svg",
    statusColor: "success" as const,
  },
];

describe("TransactionsTable", () => {
  it("renders transactions correctly", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("applies tooltips for long address and amount values", () => {
    render(<TransactionsTable transactions={mockTransactions} />);
    
    // Desktop View checks
    const addressElements = screen.getAllByTitle("0x1234567890abcdef1234567890abcdef1234567890abcdef");
    expect(addressElements.length).toBeGreaterThan(0);
    expect(addressElements[0]).toHaveAttribute("tabIndex", "0");
    expect(addressElements[0]).toHaveClass("truncate");

    const amountElements = screen.getAllByTitle("+1000000000000000000000000000.00");
    expect(amountElements.length).toBeGreaterThan(0);
    expect(amountElements[0]).toHaveAttribute("tabIndex", "0");
    expect(amountElements[0]).toHaveClass("truncate");
  });

  it("renders with logical spacing properties in RTL direction", () => {
    render(
      <div dir="rtl">
        <TransactionsTable transactions={mockTransactions} />
      </div>
    );

    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();

    const addressElements = screen.getAllByTitle("0x1234567890abcdef1234567890abcdef1234567890abcdef");
    expect(addressElements.length).toBeGreaterThan(0);
    expect(addressElements[0]).toHaveClass("-ms-1");
  });
});
