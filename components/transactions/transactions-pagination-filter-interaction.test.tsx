import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Transactions from "@/app/transactions/page";

// Mock the useTransactions hook to return data based on filterQuery
vi.mock("@/hooks/useTransactions", () => {
  return {
    useTransactions: vi.fn(({ filters }) => {
      const { filterQuery } = filters as { filterQuery: string };
      // Simulate different result sets based on filter
      const totalItems = filterQuery === "Payment Sent" ? 5 : 20; // 5 items for Payment Sent, else 20
      const data = Array.from({ length: totalItems }, (_, i) => ({
        id: `tx-${i + 1}`,
        type: "payment",
        address: "addr",
        date: "2023-01-01",
        time: "12:00",
        token: "USDC",
        amount: i + 1,
        status: "Completed",
      }));
      return { data: { data }, isLoading: false, error: null };
    }),
  };
});

describe("Transactions pagination & filter interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets to page 1 when a filter changes", async () => {
    render(<Transactions />);
    const nextBtn = screen.getByRole("button", { name: /go to next page/i });
    // navigate to page 3 (itemsPerPage=6, total 20 => pages 4)
    await userEvent.click(nextBtn);
    await userEvent.click(nextBtn);
    // verify we are on page 3
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // open filter dropdown and select a different filter
    const filterBtn = screen.getByRole("button", { name: /filter/i });
    await userEvent.click(filterBtn);
    const paymentSentItem = screen.getByRole("menuitem", { name: /payment sent/i });
    await userEvent.click(paymentSentItem);
    // after filter change, pagination should reset to page 1
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // also check that the summary reflects items 1‑5 of 5
    expect(screen.getByText(/Showing 1 to 5 of 5 items/i)).toBeInTheDocument();
  });

  it("does not reset filters when navigating pages", async () => {
    render(<Transactions />);
    // set a filter first
    const filterBtn = screen.getByRole("button", { name: /filter/i });
    await userEvent.click(filterBtn);
    const paymentSentItem = screen.getByRole("menuitem", { name: /payment sent/i });
    await userEvent.click(paymentSentItem);
    // ensure filter is applied (summary should show 5 items)
    expect(screen.getByText(/Showing 1 to 5 of 5 items/i)).toBeInTheDocument();
    // navigate pages (next button should be disabled because only 5 items)
    const nextBtn = screen.getByRole("button", { name: /go to next page/i });
    expect(nextBtn).toBeDisabled();
    // Ensure filter text still shows "Payment Sent"
    expect(screen.getByText("Payment Sent")).toBeInTheDocument();
  });

  it("handles boundary case where filter shrinks result set below current page", async () => {
    render(<Transactions />);
    const nextBtn = screen.getByRole("button", { name: /go to next page/i });
    // Move to page 4 (currentPage=4) with default "All Transactions" (20 items)
    await userEvent.click(nextBtn); // page 2
    await userEvent.click(nextBtn); // page 3
    await userEvent.click(nextBtn); // page 4
    expect(screen.getByRole("button", { name: "Page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Change filter to one that only returns 5 items
    const filterBtn = screen.getByRole("button", { name: /filter/i });
    await userEvent.click(filterBtn);
    const paymentSentItem = screen.getByRole("menuitem", { name: /payment sent/i });
    await userEvent.click(paymentSentItem);
    // Pagination should reset to page 1 automatically
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Summary should reflect the new smaller total
    expect(screen.getByText(/Showing 1 to 5 of 5 items/i)).toBeInTheDocument();
  });
});
