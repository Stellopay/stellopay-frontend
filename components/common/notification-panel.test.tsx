import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotificationPanel, { CATEGORY_STORAGE_KEY } from "./notification-panel";
import { NotificationItem } from "@/types/notification-item";

const buildNotifications = (count: number): NotificationItem[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `notif-${index}`,
    title: `Title ${index}`,
    message: `Message ${index}`,
    read: index % 2 === 0,
    category: index % 3 === 0 ? "payments" : index % 3 === 1 ? "security" : "system",
  }));

const buildCategorizedNotifications = (): NotificationItem[] => [
  { id: "notif-p1", title: "Payment Received", message: "Received 500 XLM", read: false, category: "payments" },
  { id: "notif-p2", title: "Payment Sent", message: "Sent 100 USDC", read: true, category: "payments" },
  { id: "notif-s1", title: "Password Reset", message: "Security alert", read: false, category: "security" },
  { id: "notif-sys1", title: "System Maintenance", message: "Scheduled downtime", read: true, category: "system" },
];

describe("NotificationPanel", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders a loading skeleton when isLoading is true", () => {
    render(<NotificationPanel notifications={[]} isLoading />);

    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders the empty state when notifications is empty and not loading", () => {
    render(<NotificationPanel notifications={[]} />);

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders a single notification inside the accessible listbox", () => {
    const notifications = buildNotifications(1);
    render(<NotificationPanel notifications={notifications} />);

    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    const listbox = screen.getByRole("listbox", {
      name: "Notifications list",
    });
    expect(listbox).toBeInTheDocument();
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
        category: "security",
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
      { id: "read", title: "Read item", message: "msg", read: true, category: "system" },
      { id: "unread", title: "Unread item", message: "msg", read: false, category: "system" },
    ];
    const { container } = render(
      <NotificationPanel notifications={notifications} />,
    );

    const unreadDots = container.querySelectorAll(".w-1.h-1.bg-\\[\\#EB6945\\]");
    expect(unreadDots).toHaveLength(1);
  });

  // ── Category Filter Tests ──────────────────────────────────────────

  describe("category filtering", () => {
    it("renders category filter tabs with accurate item counts", () => {
      const notifications = buildCategorizedNotifications();
      render(<NotificationPanel notifications={notifications} />);

      expect(screen.getByRole("tablist", { name: "Filter notifications by category" })).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(4);

      expect(screen.getByTestId("count-all")).toHaveTextContent("(4)");
      expect(screen.getByTestId("count-payments")).toHaveTextContent("(2)");
      expect(screen.getByTestId("count-security")).toHaveTextContent("(1)");
      expect(screen.getByTestId("count-system")).toHaveTextContent("(1)");
    });

    it("filters notifications by selected category when clicked", () => {
      const notifications = buildCategorizedNotifications();
      render(<NotificationPanel notifications={notifications} />);

      // Initially All is selected (4 items)
      expect(screen.getByText("Payment Received")).toBeInTheDocument();
      expect(screen.getByText("Password Reset")).toBeInTheDocument();
      expect(screen.getByText("System Maintenance")).toBeInTheDocument();

      // Click Payments tab
      const paymentsTab = screen.getByRole("tab", { name: /Payments/i });
      fireEvent.click(paymentsTab);

      expect(screen.getByText("Payment Received")).toBeInTheDocument();
      expect(screen.getByText("Payment Sent")).toBeInTheDocument();
      expect(screen.queryByText("Password Reset")).not.toBeInTheDocument();
      expect(screen.queryByText("System Maintenance")).not.toBeInTheDocument();

      // Click Security tab
      const securityTab = screen.getByRole("tab", { name: /Security/i });
      fireEvent.click(securityTab);

      expect(screen.queryByText("Payment Received")).not.toBeInTheDocument();
      expect(screen.getByText("Password Reset")).toBeInTheDocument();
      expect(screen.queryByText("System Maintenance")).not.toBeInTheDocument();
    });

    it("persists selected filter in sessionStorage", () => {
      const notifications = buildCategorizedNotifications();
      render(<NotificationPanel notifications={notifications} />);

      const securityTab = screen.getByRole("tab", { name: /Security/i });
      fireEvent.click(securityTab);

      expect(sessionStorage.getItem(CATEGORY_STORAGE_KEY)).toBe("security");
    });

    it("restores last-selected filter from sessionStorage on initial render", () => {
      sessionStorage.setItem(CATEGORY_STORAGE_KEY, "payments");

      const notifications = buildCategorizedNotifications();
      render(<NotificationPanel notifications={notifications} />);

      const paymentsTab = screen.getByRole("tab", { name: /Payments/i });
      expect(paymentsTab).toHaveAttribute("aria-selected", "true");

      expect(screen.getByText("Payment Received")).toBeInTheDocument();
      expect(screen.getByText("Payment Sent")).toBeInTheDocument();
      expect(screen.queryByText("Password Reset")).not.toBeInTheDocument();
    });

    it("shows empty state when a selected category has no matching notifications", () => {
      const notifications: NotificationItem[] = [
        { id: "p1", title: "Payment Received", message: "Received 500 XLM", read: false, category: "payments" },
      ];
      render(<NotificationPanel notifications={notifications} />);

      const securityTab = screen.getByRole("tab", { name: /Security/i });
      fireEvent.click(securityTab);

      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("supports keyboard ArrowRight and ArrowLeft navigation between category tabs", () => {
      const notifications = buildCategorizedNotifications();
      render(<NotificationPanel notifications={notifications} />);

      const allTab = screen.getByRole("tab", { name: /All/i });
      const paymentsTab = screen.getByRole("tab", { name: /Payments/i });
      const systemTab = screen.getByRole("tab", { name: /System/i });

      // ArrowRight from All to Payments
      fireEvent.keyDown(allTab, { key: "ArrowRight" });
      expect(paymentsTab).toHaveAttribute("aria-selected", "true");

      // ArrowLeft from Payments back to All (or ArrowLeft from All wraps to System)
      fireEvent.keyDown(paymentsTab, { key: "ArrowLeft" });
      expect(allTab).toHaveAttribute("aria-selected", "true");

      fireEvent.keyDown(allTab, { key: "ArrowLeft" });
      expect(systemTab).toHaveAttribute("aria-selected", "true");
    });
  });

  // ── Keyboard navigation ────────────────────────────────────────────

  describe("keyboard navigation", () => {
    it("applies listbox role and aria-label to the notification list", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);

      expect(
        screen.getByRole("listbox", { name: "Notifications list" }),
      ).toBeInTheDocument();
    });

    it("gives tabIndex={0} to the first item and tabIndex={-1} to others by default", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const options = screen.getAllByRole("option");

      expect(options[0]).toHaveAttribute("tabIndex", "0");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
      expect(options[2]).toHaveAttribute("tabIndex", "-1");
    });

    it("updates tabIndex when ArrowDown is pressed", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const listbox = screen.getByRole("listbox");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("tabIndex", "-1");
      expect(options[1]).toHaveAttribute("tabIndex", "0");
      expect(options[2]).toHaveAttribute("tabIndex", "-1");
    });

    it("moves focus forward with ArrowDown and backward with ArrowUp", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      expect(options[1]).toHaveAttribute("tabIndex", "0");

      fireEvent.keyDown(listbox, { key: "ArrowUp" });
      expect(options[0]).toHaveAttribute("tabIndex", "0");
    });

    it("wraps from last to first on ArrowDown", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "End" });
      expect(options[2]).toHaveAttribute("tabIndex", "0");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      expect(options[0]).toHaveAttribute("tabIndex", "0");
    });

    it("wraps from first to last on ArrowUp", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "ArrowUp" });
      expect(options[2]).toHaveAttribute("tabIndex", "0");
    });

    it("jumps to first item on Home", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      fireEvent.keyDown(listbox, { key: "Home" });
      expect(options[0]).toHaveAttribute("tabIndex", "0");
    });

    it("jumps to last item on End", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "End" });
      expect(options[2]).toHaveAttribute("tabIndex", "0");
    });

    it("sets aria-selected on the focused item", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      const options = screen.getAllByRole("option");

      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
      expect(options[2]).toHaveAttribute("aria-selected", "false");

      fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowDown" });

      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
    });

    it("calls onNotificationClick when Enter is pressed on a focused item", () => {
      const onNotificationClick = vi.fn();
      const notifications = buildNotifications(3);
      render(
        <NotificationPanel
          notifications={notifications}
          onNotificationClick={onNotificationClick}
        />,
      );

      fireEvent.keyDown(screen.getAllByRole("option")[0], { key: "Enter" });
      expect(onNotificationClick).toHaveBeenCalledWith(notifications[0]);
    });

    it("calls onNotificationClick when Space is pressed on a focused item", () => {
      const onNotificationClick = vi.fn();
      const notifications = buildNotifications(3);
      render(
        <NotificationPanel
          notifications={notifications}
          onNotificationClick={onNotificationClick}
        />,
      );

      fireEvent.keyDown(screen.getAllByRole("option")[0], { key: " " });
      expect(onNotificationClick).toHaveBeenCalledWith(notifications[0]);
    });

    it("calls onNotificationClick when an item is clicked", () => {
      const onNotificationClick = vi.fn();
      const notifications = buildNotifications(3);
      render(
        <NotificationPanel
          notifications={notifications}
          onNotificationClick={onNotificationClick}
        />,
      );

      fireEvent.click(screen.getAllByRole("option")[1]);
      expect(onNotificationClick).toHaveBeenCalledWith(notifications[1]);
    });

    it("calls onClose when Escape is pressed", () => {
      const onClose = vi.fn();
      render(
        <NotificationPanel
          notifications={buildNotifications(3)}
          onClose={onClose}
        />,
      );

      fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not call onNotificationClick when key is not Enter or Space", () => {
      const onNotificationClick = vi.fn();
      render(
        <NotificationPanel
          notifications={buildNotifications(3)}
          onNotificationClick={onNotificationClick}
        />,
      );

      fireEvent.keyDown(screen.getAllByRole("option")[0], { key: "a" });
      expect(onNotificationClick).not.toHaveBeenCalled();
    });

    it("resets focusedIndex when notifications change", () => {
      const notifications = buildNotifications(3);
      const { rerender } = render(
        <NotificationPanel notifications={notifications} />,
      );
      const listbox = screen.getByRole("listbox");

      fireEvent.keyDown(listbox, { key: "End" });
      expect(screen.getAllByRole("option")[2]).toHaveAttribute(
        "tabIndex",
        "0",
      );

      rerender(
        <NotificationPanel notifications={buildNotifications(2)} />,
      );
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("tabIndex", "0");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
    });

    it("does not render listbox role when empty", () => {
      render(<NotificationPanel notifications={[]} />);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("does not render listbox role when loading", () => {
      render(<NotificationPanel notifications={[]} isLoading />);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("renders each option with role='option'", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
      expect(screen.getAllByRole("option")).toHaveLength(3);
    });

    it("applies cursor-pointer and focus-visible ring to options", () => {
      render(<NotificationPanel notifications={buildNotifications(1)} />);
      const option = screen.getByRole("option");

      expect(option.className).toContain("cursor-pointer");
      expect(option.className).toContain("focus-visible:ring-2");
    });
  });
});
