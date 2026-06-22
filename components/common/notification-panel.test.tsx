import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotificationPanel from "./notification-panel";
import { NotificationItem } from "@/types/notification-item";

const buildNotifications = (count: number): NotificationItem[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `notif-${index}`,
    title: `Title ${index}`,
    message: `Message ${index}`,
    read: index % 2 === 0,
  }));

describe("NotificationPanel", () => {
  it("renders a loading skeleton when isLoading is true", () => {
    render(<NotificationPanel notifications={[]} isLoading />);

    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders the empty state when notifications is empty and not loading", () => {
    render(<NotificationPanel notifications={[]} />);

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders a single notification inside the accessible live region", () => {
    const notifications = buildNotifications(1);
    render(<NotificationPanel notifications={notifications} />);

    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Notifications list" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Title 0")).toBeInTheDocument();
    expect(screen.getByText("Message 0")).toBeInTheDocument();
  });

  it("renders one row per notification keyed by stable id, not array index", () => {
    const notifications = buildNotifications(3);
    const { rerender } = render(
      <NotificationPanel notifications={notifications} />,
    );

    notifications.forEach((notification) => {
      expect(screen.getByText(notification.title)).toBeInTheDocument();
    });

    // Remove the first item (simulating a dismissal). If the list were keyed
    // by array index, React would mutate the existing DOM node for index 0
    // in place instead of removing it; keying by `id` ensures the node for
    // the removed notification (notif-0) is actually removed from the DOM.
    const remaining = notifications.slice(1);
    rerender(<NotificationPanel notifications={remaining} />);

    expect(screen.queryByText("Title 0")).not.toBeInTheDocument();
    expect(screen.getByText("Title 1")).toBeInTheDocument();
    expect(screen.getByText("Title 2")).toBeInTheDocument();
  });

  it("transitions from loading to the empty state when notifications resolve to an empty array", () => {
    const { rerender } = render(
      <NotificationPanel notifications={[]} isLoading />,
    );
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();

    rerender(<NotificationPanel notifications={[]} isLoading={false} />);
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it("renders the bell trigger with an accessible label", () => {
    render(<NotificationPanel notifications={buildNotifications(1)} />);

    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("renders notification text as plain escaped text, not raw markup", () => {
    const malicious: NotificationItem[] = [
      {
        id: "notif-xss",
        title: "<img src=x onerror=alert(1)>",
        message: "<script>alert('xss')</script>",
        read: false,
      },
    ];
    render(<NotificationPanel notifications={malicious} />);

    expect(
      screen.getByText("<img src=x onerror=alert(1)>"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("<script>alert('xss')</script>"),
    ).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
    expect(document.querySelector("img")).not.toBeInTheDocument();
  });

  it("shows the unread indicator only for unread notifications", () => {
    const notifications: NotificationItem[] = [
      { id: "read", title: "Read item", message: "msg", read: true },
      { id: "unread", title: "Unread item", message: "msg", read: false },
    ];
    const { container } = render(
      <NotificationPanel notifications={notifications} />,
    );

    const unreadDots = container.querySelectorAll(".bg-\\[\\#EB6945\\]");
    expect(unreadDots).toHaveLength(1);
  });
});
