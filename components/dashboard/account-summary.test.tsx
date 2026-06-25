import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import AccountSummary from "./account-summary";

const mockUseAccountSummary = vi.fn();

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
});
