import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";

import PaymentHistory from "./payment-history";

const mockUsePaymentHistory = vi.fn();

vi.mock("@/hooks/usePaymentHistory", () => ({
  usePaymentHistory: () => mockUsePaymentHistory(),
}));

describe("PaymentHistory", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    // Stub click on anchor to avoid navigation in test
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
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

  it("exports payment history as CSV with correctly escaped content", () => {
    const BlobSpy = vi.spyOn(global, "Blob");

    mockUsePaymentHistory.mockReturnValue({
      data: [
        {
          id: "ph-1",
          paymentDescription: "Payment, Sent",
          paymentId: "#TXN1",
          history: "Payment of 250 XLM",
        },
        {
          id: "ph-2",
          paymentDescription: "Payment Received",
          paymentId: "",
          history: "=cmd|' /C calc'!A0",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PaymentHistory />);

    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    expect(BlobSpy).toHaveBeenCalled();
    const blobContent = BlobSpy.mock.calls[0][0][0];

    const expectedCsv = [
      "Description,Payment ID,Details",
      '"Payment, Sent",#TXN1,Payment of 250 XLM',
      "Payment Received,,'=cmd|' /C calc'!A0",
    ].join("\n");

    expect(blobContent).toBe(expectedCsv);
  });
});
