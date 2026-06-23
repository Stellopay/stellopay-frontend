import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import PaymentHistory from "./payment-history";

const mockUsePaymentHistory = vi.fn();

vi.mock("@/hooks/usePaymentHistory", () => ({
  usePaymentHistory: () => mockUsePaymentHistory(),
}));

describe("PaymentHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the hook refetch callback from the dashboard error state", () => {
    const refetch = vi.fn();

    mockUsePaymentHistory.mockReturnValue({
      data: [],
      isLoading: false,
      error: "Payment history failed",
      refetch,
    });

    render(<PaymentHistory />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
