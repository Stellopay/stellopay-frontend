import { render } from "@testing-library/react";
import {
  AnalyticsViewSkeleton,
  PaymentHistorySkeleton,
} from "@/components/dashboard/analytics-view-skeleton";

describe("AnalyticsViewSkeleton", () => {
  it("renders chart and notifications sections", () => {
    const { container } = render(<AnalyticsViewSkeleton />);
    // Check for main container with two sections
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("flex");
    expect(mainContainer).toHaveClass("gap-6");
  });

  it("renders skeleton elements with shimmer animation", () => {
    const { container } = render(<AnalyticsViewSkeleton />);
    const skeletonElements = container.querySelectorAll(".skeleton-shimmer");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders chart section with bars", () => {
    const { container } = render(<AnalyticsViewSkeleton />);
    // Chart section (w-2/3)
    const chartSection = container.querySelector(".w-2\\/3");
    expect(chartSection).toBeInTheDocument();
  });

  it("renders notifications section", () => {
    const { container } = render(<AnalyticsViewSkeleton />);
    // Notifications section (w-1/3)
    const notificationsSection = container.querySelector(".w-1\\/3");
    expect(notificationsSection).toBeInTheDocument();
  });
});

describe("PaymentHistorySkeleton", () => {
  it("renders 3 payment history items", () => {
    const { container } = render(<PaymentHistorySkeleton />);
    // Check for items with border class
    const historyItems = container.querySelectorAll(".border-\\[\\#2D2D2D\\]");
    expect(historyItems).toHaveLength(3);
  });

  it("renders skeleton elements", () => {
    const { container } = render(<PaymentHistorySkeleton />);
    const skeletonElements = container.querySelectorAll(".skeleton-shimmer");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
