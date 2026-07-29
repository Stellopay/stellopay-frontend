import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import TransactionHistory from "./transaction-history";
import { useTransactions } from "@/hooks/useTransactions";

const mockUseTransactions = vi.fn();

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => mockUseTransactions(),
}));

function mockTransactions(data: unknown[], total = data.length) {
  return {
    data: {
      data: data,
      total,
      page: 1,
      pageSize: 6,
      totalPages: 1,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
}

const SAMPLE_TRANSACTIONS = [
  {
    id: "tx-1",
    type: "Payment Sent",
    txId: "#TXN12345",
    address: "GABCDE...XYZ67890",
    date: "Apr 12, 2023",
    time: "09:32AM",
    token: "USDC",
    amount: 0.005,
    status: "Completed",
    statusColor: "success" as const,
  },
  {
    id: "tx-2",
    type: "Payment Received",
    txId: "#TXN12346",
    address: "0xA1B2...C3D4E5",
    date: "Apr 12, 2023",
    time: "10:15AM",
    token: "XLM",
    amount: 0.25,
    status: "Pending",
    statusColor: "warning" as const,
  },
];

describe("TransactionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  describe("loading state", () => {
    it("renders the loading skeleton while transactions are being fetched", () => {
      mockUseTransactions.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<TransactionHistory />);

      expect(
        screen.getByRole("status", { name: /loading transactions/i }),
      ).toBeInTheDocument();
    });

    it("does not announce transactions while still loading", () => {
      mockUseTransactions.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<TransactionHistory />);

      expect(
        screen.queryByRole("status", { name: /transaction.*loaded/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Success state — announcement
  // ---------------------------------------------------------------------------
  describe("success state", () => {
    it("announces the row count when transactions finish loading", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions(SAMPLE_TRANSACTIONS));

      render(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByRole("status", { name: /2 transactions loaded/i }),
        ).toBeInTheDocument();
      });
    });

    it("announces singular count for a single transaction", async () => {
      mockUseTransactions.mockReturnValue(
        mockTransactions([SAMPLE_TRANSACTIONS[0]]),
      );

      render(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByRole("status", { name: /1 transaction loaded/i }),
        ).toBeInTheDocument();
      });
    });

    it("uses aria-live='polite' on the announcement region", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions(SAMPLE_TRANSACTIONS));

      render(<TransactionHistory />);

      await waitFor(() => {
        const liveRegion = screen.getByRole("status", {
          name: /2 transactions loaded/i,
        });
        expect(liveRegion).toHaveAttribute("aria-live", "polite");
      });
    });

    it("uses aria-atomic='true' so the full message is read", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions(SAMPLE_TRANSACTIONS));

      render(<TransactionHistory />);

      await waitFor(() => {
        const liveRegion = screen.getByRole("status", {
          name: /2 transactions loaded/i,
        });
        expect(liveRegion).toHaveAttribute("aria-atomic", "true");
      });
    });

    it("does not re-announce when an unrelated re-render occurs", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions(SAMPLE_TRANSACTIONS));

      const { rerender } = render(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByRole("status", { name: /2 transactions loaded/i }),
        ).toBeInTheDocument();
      });

      const announcementBefore = screen.getByRole("status").textContent;

      rerender(<TransactionHistory />);

      await act(async () => {
        vi.useFakeTimers();
        vi.advanceTimersByTime(0);
        vi.useRealTimers();
      });

      const announcementAfter = screen.getByRole("status").textContent;
      expect(announcementAfter).toBe(announcementBefore);
    });

    it("does not announce again after a refetch cycle", async () => {
      const refetch = vi.fn();
      mockUseTransactions.mockReturnValue(mockTransactions(SAMPLE_TRANSACTIONS));

      render(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByRole("status", { name: /2 transactions loaded/i }),
        ).toBeInTheDocument();
      });

      const announcementElementsBefore = screen.getAllByRole("status");
      const countBefore = announcementElementsBefore.filter(
        (el) => /transactions loaded/.test(el.textContent || ""),
      ).length;

      act(() => {
        refetch();
      });

      await waitFor(() => {
        expect(mockUseTransactions).toHaveBeenCalledTimes(2);
      });

      const announcementElementsAfter = screen.getAllByRole("status");
      const countAfter = announcementElementsAfter.filter(
        (el) => /transactions loaded/.test(el.textContent || ""),
      ).length;

      expect(countAfter).toBe(countBefore);
    });
  });

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  describe("empty state", () => {
    it("announces zero transactions when the result set is empty", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions([]));

      render(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByText("No transactions loaded"),
        ).toBeInTheDocument();
      });
    });

    it("does not render the transaction table in the empty state", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions([]));

      render(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.queryByRole("table"),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  describe("error state", () => {
    it("does not announce when transactions fail to load", () => {
      mockUseTransactions.mockReturnValue({
        data: null,
        isLoading: false,
        error: "Network failure",
        refetch: vi.fn(),
      });

      render(<TransactionHistory />);

      expect(
        screen.queryByRole("status", { name: /transaction.*loaded/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("shows the error state with a retry button", () => {
      const refetch = vi.fn();
      mockUseTransactions.mockReturnValue({
        data: null,
        isLoading: false,
        error: "Network failure",
        refetch,
      });

      render(<TransactionHistory />);

      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Fake timers — announcement timing
  // ---------------------------------------------------------------------------
  describe("announcement timing with fake timers", () => {
    it("does not fire the announcement on every re-render, only on the loading-to-loaded transition", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions(SAMPLE_TRANSACTIONS));

      const { rerender } = render(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByRole("status", { name: /2 transactions loaded/i }),
        ).toBeInTheDocument();
      });

      const announcementText = screen.getByRole("status").textContent;

      rerender(<TransactionHistory />);

      await act(async () => {
        vi.useFakeTimers();
        vi.advanceTimersByTime(100);
        vi.useRealTimers();
      });

      expect(screen.getByRole("status").textContent).toBe(announcementText);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  describe("accessibility", () => {
    it("the live region is visually hidden but accessible to screen readers", async () => {
      mockUseTransactions.mockReturnValue(mockTransactions(SAMPLE_TRANSACTIONS));

      render(<TransactionHistory />);

      await waitFor(() => {
        const liveRegion = screen.getByRole("status", {
          name: /2 transactions loaded/i,
        });
        expect(liveRegion).toHaveClass("sr-only");
      });
    });
  });
});