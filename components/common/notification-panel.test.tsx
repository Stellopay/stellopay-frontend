import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NotificationPanel from "./notification-panel";
import { NotificationItem } from "@/types/notification-item";

const buildNotifications = (count: number): NotificationItem[] =>
  Array.from({ length: count }).map((_, index) => {
    const isRead = index % 2 === 0;
    return {
      id: `notif-${index}`,
      title: `Title ${index}`,
      message: `Message ${index}`,
      read: isRead,
      ...(isRead ? { readAt: new Date().toISOString() } : {}),
    };
  });

describe("NotificationPanel", () => {
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

    const unreadDots = container.querySelectorAll(".w-1.h-1.bg-\\[\\#EB6945\\]");
    expect(unreadDots).toHaveLength(1);
  });

  it("displays the readAt timestamp for read notifications if provided", () => {
    const notifications: NotificationItem[] = [
      { id: "read", title: "Read item", message: "msg", read: true, readAt: "2026-07-29T15:00:00Z" },
    ];
    render(<NotificationPanel notifications={notifications} />);

    expect(screen.getByText(/Read:/)).toBeInTheDocument();
  });

  // ── Keyboard navigation ────────────────────────────────────────────

  describe("keyboard navigation", () => {
    it("applies listbox role and aria-label to the notification list", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} />);
#602
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
