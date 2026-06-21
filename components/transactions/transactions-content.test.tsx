import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import TransactionsContent from "./transactions-content";
import { TransactionsTable } from "./transactions-table";
import {
  TRANSACTIONS_DEFAULT_DATE_RANGE,
  TRANSACTIONS_ITEMS_PER_PAGE,
} from "./transactions-config";

const mockUseTransactions = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: mockUseTransactions,
}));

vi.mock("./transactions-header", () => ({
  default: () => <div data-testid="transactions-header" />,
}));

vi.mock("./transactions-filters", () => ({
  default: () => <div data-testid="transactions-filters" />,
}));

vi.mock("./transactions-pagination", () => ({
  default: () => <div data-testid="transactions-pagination" />,
}));

describe("TransactionsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTransactions.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
  });

  it("uses the shared transaction defaults for date range and page size", () => {
    render(<TransactionsContent />);

    expect(mockUseTransactions).toHaveBeenCalledWith({
      filters: expect.objectContaining({
        fromDate: TRANSACTIONS_DEFAULT_DATE_RANGE.fromDate,
        toDate: TRANSACTIONS_DEFAULT_DATE_RANGE.toDate,
      }),
      page: 1,
      pageSize: TRANSACTIONS_ITEMS_PER_PAGE,
    });
  });
});

describe("TransactionsTable loading rows", () => {
  it("keeps desktop and mobile skeleton counts in sync with page size", () => {
    render(<TransactionsTable transactions={[]} isLoading />);

    expect(
      screen.getAllByTestId("transaction-table-desktop-skeleton-row"),
    ).toHaveLength(TRANSACTIONS_ITEMS_PER_PAGE);
    expect(
      screen.getAllByTestId("transaction-table-mobile-skeleton-row"),
    ).toHaveLength(TRANSACTIONS_ITEMS_PER_PAGE);
  });
});
