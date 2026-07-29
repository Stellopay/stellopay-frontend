import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransactionsTable } from "./transactions-table";

const LONG_ADDRESS = "GA4GYKB4JP2K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y";
const TRUNCATED_ADDRESS = "GA4GYK...BH4GJ6";

const mockTransactions = [
  {
    id: "1",
    type: "Deposit",
    txId: "TX123",
    address: LONG_ADDRESS,
    date: "2023-10-27",
    time: "10:00 AM",
    token: "ETH",
    amount: "+1000000000000000000000000000.00",
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

  it("truncates long addresses using truncateStellarAddress", () => {
    render(<TransactionsTable transactions={mockTransactions} />);

    // Desktop: the visible text should be the truncated version
    expect(screen.getByText(TRUNCATED_ADDRESS)).toBeInTheDocument();

    // The full address should still be available as a tooltip
    const addressElements = screen.getAllByTitle(LONG_ADDRESS);
    expect(addressElements.length).toBeGreaterThan(0);
    expect(addressElements[0]).toHaveAttribute("tabIndex", "0");
    expect(addressElements[0]).toHaveClass("truncate");
  });

  it("applies tooltips for long amount values", () => {
    render(<TransactionsTable transactions={mockTransactions} />);

    const amountElements = screen.getAllByTitle("+1000000000000000000000000000.00");
    expect(amountElements.length).toBeGreaterThan(0);
    expect(amountElements[0]).toHaveAttribute("tabIndex", "0");
    expect(amountElements[0]).toHaveClass("truncate");
  });

  it("renders empty state when no transactions and not loading", () => {
    render(<TransactionsTable transactions={[]} />);
    expect(screen.getByText("No Transactions Found")).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
  });

  it("renders loading skeletons when isLoading is true", () => {
    const { container } = render(
      <TransactionsTable transactions={[]} isLoading={true} />,
    );
    // Should render skeleton rows instead of empty state
    expect(screen.queryByText("No Transactions Found")).not.toBeInTheDocument();
    // Verify skeleton elements are present
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
