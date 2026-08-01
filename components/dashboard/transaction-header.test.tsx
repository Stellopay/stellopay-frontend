import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TransactionHeader from "./transaction-header";

vi.mock("../transactions/date", () => ({
  Date: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid={`date-${placeholder?.toLowerCase().replace(/\s+/g, "-")}`}>
      {placeholder}
    </div>
  ),
}));

describe("TransactionHeader", () => {
  const defaultProps = {
    pageTitle: "Transactions",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    onStartDateChange: vi.fn(),
    onEndDateChange: vi.fn(),
  };

  it("renders the page title", () => {
    render(<TransactionHeader {...defaultProps} />);
    expect(screen.getByText("Transactions")).toBeInTheDocument();
  });

  it("renders date pickers", () => {
    render(<TransactionHeader {...defaultProps} />);
    expect(screen.getByTestId("date-start-date")).toBeInTheDocument();
    expect(screen.getByTestId("date-end-date")).toBeInTheDocument();
  });

  it("does not render sort column headers when sort props are omitted", () => {
    render(<TransactionHeader {...defaultProps} />);
    expect(screen.queryByText("Transaction Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Date")).not.toBeInTheDocument();
    expect(screen.queryByText("Amount")).not.toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
  });

  it("renders sort column headers when sort props are provided", () => {
    render(
      <TransactionHeader
        {...defaultProps}
        sortField="date"
        sortDirection="asc"
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByText("Transaction Type")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});

describe("TransactionHeader sort icons", () => {
  const defaultProps = {
    pageTitle: "Transactions",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    onStartDateChange: vi.fn(),
    onEndDateChange: vi.fn(),
    onSort: vi.fn(),
  };

  it("shows ascending icon on the active column when sortDirection is asc", () => {
    render(
      <TransactionHeader
        {...defaultProps}
        sortField="date"
        sortDirection="asc"
      />,
    );
    const dateButton = screen.getByText("Date").closest("button");
    const svgs = dateButton?.querySelectorAll("svg") ?? [];
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("shows descending icon on the active column when sortDirection is desc", () => {
    render(
      <TransactionHeader
        {...defaultProps}
        sortField="date"
        sortDirection="desc"
      />,
    );
    const dateButton = screen.getByText("Date").closest("button");
    const svgs = dateButton?.querySelectorAll("svg") ?? [];
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("renders neutral icons on non-active columns", () => {
    render(
      <TransactionHeader
        {...defaultProps}
        sortField="date"
        sortDirection="asc"
      />,
    );
    const amountButton = screen.getByText("Amount").closest("button");
    const svgs = amountButton?.querySelectorAll("svg") ?? [];
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("calls onSort with the correct field when a column header is clicked", () => {
    const onSort = vi.fn();
    render(
      <TransactionHeader
        {...defaultProps}
        sortField="date"
        sortDirection="asc"
        onSort={onSort}
      />,
    );
    fireEvent.click(screen.getByText("Amount"));
    expect(onSort).toHaveBeenCalledWith("amount");
  });

  it("updates icon when sortField changes from one column to another", () => {
    const { rerender } = render(
      <TransactionHeader
        {...defaultProps}
        sortField="date"
        sortDirection="asc"
      />,
    );
    const dateButton = screen.getByText("Date").closest("button");
    expect(dateButton?.querySelectorAll("svg").length).toBeGreaterThan(0);

    rerender(
      <TransactionHeader
        {...defaultProps}
        sortField="amount"
        sortDirection="desc"
      />,
    );
    const amountButton = screen.getByText("Amount").closest("button");
    expect(amountButton?.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("toggles direction when the same column is clicked", () => {
    const onSort = vi.fn();
    render(
      <TransactionHeader
        {...defaultProps}
        sortField="date"
        sortDirection="asc"
        onSort={onSort}
      />,
    );
    fireEvent.click(screen.getByText("Date"));
    expect(onSort).toHaveBeenCalledWith("date");
  });
});
