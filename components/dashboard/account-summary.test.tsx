import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import type { AccountSummary as AccountSummaryData } from "@/lib/api/transactions";
import AccountSummary from "./account-summary";

const mockUseAccountSummary = vi.fn();

const baseSummary: AccountSummaryData = {
  balance: "10 XLM",
  balanceRaw: 10,
  paidThisMonth: "$ 0",
  paidThisMonthCount: 0,
  toBePaid: "$ 0",
  toBePaidCount: 0,
  walletAddress: "GCUSTOMADDRESS",
  source: "horizon",
  network: "stellar",
  nativeBalance: "12",
  spendableBalance: "10",
  isUnfunded: false,
  balances: [],
  trustlines: [],
};

vi.mock("@/hooks/useAccountSummary", () => ({
  useAccountSummary: () => mockUseAccountSummary(),
}));

describe("AccountSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the hook refetch callback from the dashboard error state", () => {
    const refetch = vi.fn();
    mockUseAccountSummary.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Account summary failed",
      refetch,
    });

    render(<AccountSummary />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the unfunded empty state and refreshes on demand", () => {
    const refetch = vi.fn();
    mockUseAccountSummary.mockReturnValue({
      data: { ...baseSummary, isUnfunded: true, balance: "0 XLM" },
      isLoading: false,
      error: null,
      refetch,
    });

    render(<AccountSummary />);

    expect(
      screen.getByText("Account not funded yet"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders live Horizon data without a demo badge", () => {
    mockUseAccountSummary.mockReturnValue({
      data: baseSummary,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AccountSummary />);

    expect(screen.getByText("10 XLM")).toBeInTheDocument();
    expect(screen.getByText("GCUSTOMADDRESS")).toBeInTheDocument();
    expect(screen.queryByTestId("demo-data-badge")).not.toBeInTheDocument();
  });

  it("labels mock data and exposes trustline details", () => {
    mockUseAccountSummary.mockReturnValue({
      data: {
        ...baseSummary,
        source: "mock",
        trustlines: [
          {
            assetCode: "USDC",
            assetType: "credit_alphanum12",
            assetIssuer: "GISSUER",
            balance: "12.5",
            limit: "1000",
            isAuthorized: true,
            buyingLiabilities: "0",
            sellingLiabilities: "0",
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AccountSummary />);

    expect(screen.getByTestId("demo-data-badge")).toHaveTextContent(
      "Demo data",
    );
    expect(screen.getByText(/1 trustline/)).toBeInTheDocument();
    expect(
      screen.getByLabelText("1 trustline: USDC: 12.5"),
    ).toBeInTheDocument();
  });
});
