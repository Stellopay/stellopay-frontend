import { render } from "@testing-library/react";
import {
  NotificationPanelSkeleton,
  NotificationItemSkeleton,
} from "@/components/common/notification-panel-skeleton";

describe("NotificationPanelSkeleton", () => {
  it("renders with default 3 items", () => {
    const { container } = render(<NotificationPanelSkeleton />);
    // Count notification items (inner cards)
    const notificationItems = container.querySelectorAll(
      ".bg-\\[\\#12121266\\]"
    );
    expect(notificationItems).toHaveLength(3);
  });

  it("renders with custom item count", () => {
    const { container } = render(<NotificationPanelSkeleton itemCount={5} />);
    const notificationItems = container.querySelectorAll(
      ".bg-\\[\\#12121266\\]"
    );
    expect(notificationItems).toHaveLength(5);
  });

  it("renders skeleton elements with shimmer animation", () => {
    const { container } = render(<NotificationPanelSkeleton />);
    const skeletonElements = container.querySelectorAll(".skeleton-shimmer");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("has correct container styling", () => {
    const { container } = render(<NotificationPanelSkeleton />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("bg-[#0D0D0D80]");
    expect(wrapper).toHaveClass("rounded-xl");
    expect(wrapper).toHaveClass("border-[#2D2D2D]");
  });
});

describe("NotificationItemSkeleton", () => {
  it("renders correctly", () => {
    const { container } = render(<NotificationItemSkeleton />);
    const item = container.firstChild;
    expect(item).toHaveClass("bg-[#12121266]");
    expect(item).toHaveClass("rounded-lg");
  });

  it("renders skeleton elements for title and message", () => {
    const { container } = render(<NotificationItemSkeleton />);
    const skeletonElements = container.querySelectorAll(".skeleton-shimmer");
    expect(skeletonElements.length).toBeGreaterThanOrEqual(2);
  });
});
