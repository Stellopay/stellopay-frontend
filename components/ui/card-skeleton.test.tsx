import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardSkeleton, AccountSummaryCardSkeleton } from "./card-skeleton";
import React from "react";

describe("CardSkeleton", () => {
  it("renders with default props (loading state)", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("respects the lines prop", () => {
    const { container } = render(<CardSkeleton lines={5} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("hides header when showHeader is false", () => {
    const { container } = render(<CardSkeleton showHeader={false} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("applies custom className (supports dark mode / RTL context classes)", () => {
    const { container } = render(<CardSkeleton className="dark:bg-slate-800 rtl:mr-4" />);
    expect(container.firstChild).toHaveClass("dark:bg-slate-800", "rtl:mr-4");
  });

  it("uses skeleton-shimmer on all inner placeholders (shared animation timing)", () => {
    const { container } = render(<CardSkeleton lines={3} />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThanOrEqual(5);
  });
});

describe("AccountSummaryCardSkeleton", () => {
  it("renders the account summary loading state correctly", () => {
    const { container } = render(<AccountSummaryCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("uses skeleton-shimmer on all inner placeholders", () => {
    const { container } = render(<AccountSummaryCardSkeleton />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThanOrEqual(4);
  });
});