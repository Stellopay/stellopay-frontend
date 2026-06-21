import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_TRANSACTION_FILTERS,
  TRANSACTIONS_PAGE_SIZE,
} from "@/lib/transactionDefaults";
import { TransactionsTable } from "./transactions-table";

vi.mock("next/image", () => ({
  default: () => null,
}));

describe("transaction display defaults", () => {
  it("starts with an unset date range instead of a stale fixed window", () => {
    expect(DEFAULT_TRANSACTION_FILTERS.fromDate).toBe("");
    expect(DEFAULT_TRANSACTION_FILTERS.toDate).toBe("");
    expect(DEFAULT_TRANSACTION_FILTERS.fromDate).not.toBe("2023-03-26");
    expect(DEFAULT_TRANSACTION_FILTERS.toDate).not.toBe("2023-04-15");
  });
});

describe("TransactionsTable loading skeleton", () => {
  it("uses the shared transaction page size for desktop and mobile skeleton rows", () => {
    render(<TransactionsTable transactions={[]} isLoading />);

    expect(
      screen.getAllByTestId("transaction-table-skeleton-row"),
    ).toHaveLength(TRANSACTIONS_PAGE_SIZE);
    expect(screen.getAllByTestId("transaction-card-skeleton")).toHaveLength(
      TRANSACTIONS_PAGE_SIZE,
    );
  });

  it("keeps desktop and mobile skeleton counts in sync when a row count is supplied", () => {
    render(<TransactionsTable transactions={[]} isLoading skeletonRows={3} />);

    expect(
      screen.getAllByTestId("transaction-table-skeleton-row"),
    ).toHaveLength(3);
    expect(screen.getAllByTestId("transaction-card-skeleton")).toHaveLength(3);
  });
});
