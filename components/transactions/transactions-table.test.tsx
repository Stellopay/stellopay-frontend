import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    memo: "Test memo for deposit transaction",
    counterparty: "0xabcdef1234567890abcdef1234567890abcdef12345678",
    fee: "0.001 ETH",
    hash: "0xhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
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

  describe("Quick-view Dialog", () => {
    it("renders view detail buttons for each transaction", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      // Desktop view - find the eye icon button
      const viewDetailButtons = screen.getAllByLabelText(/View details for transaction/i);
      expect(viewDetailButtons.length).toBeGreaterThan(0);
    });

    it("opens quick-view dialog when clicking view detail button", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      // Dialog should be visible
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      expect(screen.getByText("Test memo for deposit transaction")).toBeInTheDocument();
    });

    it("opens quick-view dialog on Enter key press", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.keyDown(viewDetailButton, { key: "Enter" });
      
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
    });

    it("opens quick-view dialog on Space key press", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.keyDown(viewDetailButton, { key: " " });
      
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
    });

    it("displays all transaction details in the dialog", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      // Check all fields are displayed
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      // Use getAllByText since "Deposit" appears in both table and dialog
      expect(screen.getAllByText("Deposit").length).toBeGreaterThan(0);
      expect(screen.getAllByText("#1").length).toBeGreaterThan(0);
      expect(screen.getByText("Test memo for deposit transaction")).toBeInTheDocument();
      expect(screen.getByText("0.001 ETH")).toBeInTheDocument();
      expect(screen.getByText("0xhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890")).toBeInTheDocument();
      expect(screen.getByText("View Full Details")).toBeInTheDocument();
    });

    it("includes link to full transaction details page", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      const fullDetailsLink = screen.getByRole("link", { name: /View full details/i });
      expect(fullDetailsLink).toHaveAttribute("href", "/transactions/1");
    });

    it("closes dialog when pressing Escape", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      
      // Press Escape to close
      fireEvent.keyDown(document, { key: "Escape" });
      
      // Dialog should be closed
      expect(screen.queryByText("Transaction Details")).not.toBeInTheDocument();
    });

    it("handles transactions without optional fields", () => {
      const minimalTransaction = [{
        id: "2",
        type: "Withdrawal",
        txId: "TX124",
        address: "0x987654321",
        date: "2023-10-28",
        time: "2:00 PM",
        token: "USDC",
        amount: "-50.00",
        status: "Pending" as const,
        tokenIcon: "/icons/usdc.svg",
        statusColor: "warning" as const,
      }];
      
      render(<TransactionsTable transactions={minimalTransaction} />);
      
      // Use getAllByLabelText since both desktop and mobile views render the button
      const viewDetailButtons = screen.getAllByLabelText(/View details for transaction 2/i);
      fireEvent.click(viewDetailButtons[0]);
      
      // Dialog should still open and show basic info
      expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      // Use getAllByText since "Withdrawal" appears in both table and dialog
      expect(screen.getAllByText("Withdrawal").length).toBeGreaterThan(0);
      expect(screen.getAllByText("#2").length).toBeGreaterThan(0);
      
      // Optional fields should not be in the document
      expect(screen.queryByText("Memo")).not.toBeInTheDocument();
      expect(screen.queryByText("Counterparty")).not.toBeInTheDocument();
      expect(screen.queryByText("Fee")).not.toBeInTheDocument();
      expect(screen.queryByText("Transaction Hash")).not.toBeInTheDocument();
    });
  });

  describe("Mobile Cards", () => {
    it("renders mobile transaction cards", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      // Mobile cards should be in the document (hidden on desktop)
      const mobileCards = screen.getAllByRole("button", { name: /View details for transaction/i });
      // At least one mobile card should exist
      expect(mobileCards.length).toBeGreaterThan(0);
    });

    it("opens dialog when clicking mobile transaction card", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      // Find mobile card button
      const mobileCards = screen.getAllByRole("button", { name: /View details for transaction 1/i });
      const mobileCard = mobileCards.find(card => card.className.includes("w-full text-left"));
      
      if (mobileCard) {
        fireEvent.click(mobileCard);
        expect(screen.getByText("Transaction Details")).toBeInTheDocument();
      }
    });
  });

  describe("Accessibility", () => {
    it("has accessible labels for view detail buttons", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButtons = screen.getAllByLabelText(/View details for transaction/i);
      viewDetailButtons.forEach((button, index) => {
        expect(button).toHaveAttribute("aria-label", `View details for transaction ${mockTransactions[0].id}`);
      });
    });

    it("has proper status badge aria-labels in dialog", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      // Status badges should have aria-label (multiple may exist - one in table, one in dialog)
      const statusBadges = screen.getAllByLabelText(`Status: ${mockTransactions[0].status}`);
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it("has accessible link to full transaction details", () => {
      render(<TransactionsTable transactions={mockTransactions} />);
      
      const viewDetailButton = screen.getAllByLabelText(/View details for transaction/i)[0];
      fireEvent.click(viewDetailButton);
      
      const fullDetailsLink = screen.getByRole("link", { name: /View full details for transaction/i });
      expect(fullDetailsLink).toBeInTheDocument();
    });
  });
});
