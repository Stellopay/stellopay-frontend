import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { TableSkeleton, TransactionTableSkeleton } from "./table-skeleton";

describe("TableSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the default number of rows (6)", () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelector(".divide-y")?.children;
    expect(rows).toHaveLength(6);
  });

  it("accepts a custom row count", () => {
    const { container } = render(<TableSkeleton rows={3} />);
    const rows = container.querySelector(".divide-y")?.children;
    expect(rows).toHaveLength(3);
  });

  it("renders a larger custom row count", () => {
    const { container } = render(<TableSkeleton rows={10} />);
    const rows = container.querySelector(".divide-y")?.children;
    expect(rows).toHaveLength(10);
  });

  it("renders zero body rows when rows={0}", () => {
    const { container } = render(<TableSkeleton rows={0} />);
    const rows = container.querySelector(".divide-y")?.children;
    expect(rows).toHaveLength(0);
  });

  it("keeps the header unaffected by the rows prop", () => {
    const { container } = render(<TableSkeleton rows={2} />);
    const headerCells = container.querySelector(".border-b")?.children;
    expect(headerCells).toHaveLength(6);
    expect(container.querySelector(".divide-y")?.children).toHaveLength(2);
  });

  it("renders the header by default", () => {
    const { container } = render(<TableSkeleton />);
    const headerCells = container.querySelectorAll(".border-b .bg-\\[\\#2D2D2D\\]");
    expect(headerCells.length).toBeGreaterThan(0);
  });

  it("hides the header when showHeader=false", () => {
    const { container } = render(<TableSkeleton showHeader={false} />);
    expect(container.querySelector(".border-b")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<TableSkeleton className="test-outer" />);
    expect(container.firstChild).toHaveClass("test-outer");
  });

  it("renders the correct number of columns in each row", () => {
    const { container } = render(<TableSkeleton columns={4} rows={2} />);
    const rows = container.querySelectorAll(".divide-y > div");
    rows.forEach((row) => {
      const cells = row.querySelectorAll(".bg-\\[\\#2D2D2D\\]");
      expect(cells).toHaveLength(4);
    });
  });

  it("uses skeleton-shimmer on all cells (shared animation timing)", () => {
    const { container } = render(<TableSkeleton columns={3} rows={2} />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThanOrEqual(6);
  });
});

describe("TransactionTableSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<TransactionTableSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the default number of rows (6)", () => {
    const { container } = render(<TransactionTableSkeleton />);
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows).toHaveLength(6);
  });

  it("accepts a custom row count", () => {
    const { container } = render(<TransactionTableSkeleton rows={3} />);
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows).toHaveLength(3);
  });

  it("renders a larger custom row count", () => {
    const { container } = render(<TransactionTableSkeleton rows={10} />);
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows).toHaveLength(10);
  });

  it("renders zero body rows when rows={0}", () => {
    const { container } = render(<TransactionTableSkeleton rows={0} />);
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows).toHaveLength(0);
  });

  it("renders a header row", () => {
    const { container } = render(<TransactionTableSkeleton />);
    const header = container.querySelector(".border-b");
    expect(header).toBeInTheDocument();
  });

  it("renders avatar circles for the token column", () => {
    const { container } = render(<TransactionTableSkeleton rows={1} />);
    const avatars = container.querySelectorAll(".rounded-full");
    expect(avatars.length).toBeGreaterThan(0);
  });

  it("uses skeleton-shimmer on all placeholders (shared animation timing)", () => {
    const { container } = render(<TransactionTableSkeleton rows={2} />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThanOrEqual(12);
  });
});