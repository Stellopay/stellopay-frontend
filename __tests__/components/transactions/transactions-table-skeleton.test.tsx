import { render, screen } from "@testing-library/react";
import { TransactionsTableSkeleton } from "@/components/transactions/transactions-table-skeleton";

describe("TransactionsTableSkeleton", () => {
  it("renders with default 6 rows", () => {
    const { container } = render(<TransactionsTableSkeleton />);
    // Desktop table rows (tbody tr)
    const tableRows = container.querySelectorAll("tbody tr");
    expect(tableRows).toHaveLength(6);
  });

  it("renders with custom number of rows", () => {
    const { container } = render(<TransactionsTableSkeleton rows={3} />);
    const tableRows = container.querySelectorAll("tbody tr");
    expect(tableRows).toHaveLength(3);
  });

  it("renders both desktop and mobile views", () => {
    const { container } = render(<TransactionsTableSkeleton rows={2} />);
    // Desktop table (hidden on mobile)
    const desktopTable = container.querySelector(".hidden.md\\:block");
    expect(desktopTable).toBeInTheDocument();

    // Mobile cards (hidden on desktop)
    const mobileCards = container.querySelector(".md\\:hidden");
    expect(mobileCards).toBeInTheDocument();
  });

  it("renders skeleton elements with shimmer animation", () => {
    const { container } = render(<TransactionsTableSkeleton rows={1} />);
    const skeletonElements = container.querySelectorAll(".skeleton-shimmer");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders table headers correctly", () => {
    render(<TransactionsTableSkeleton />);
    expect(screen.getByText("Transaction Type")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Token")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});
