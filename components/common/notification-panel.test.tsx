import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import NotificationPanel, { NotificationItem } from "./notification-panel";

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "test-1",
    title: "Test Alert 1",
    message: "First test message",
    timestamp: "1m ago",
    read: false,
  },
  {
    id: "test-2",
    title: "Test Alert 2",
    message: "Second test message",
    timestamp: "10m ago",
    read: true,
  },
];

describe("NotificationPanel (#792 Clear All with Undo)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders notification items and unread count correctly", () => {
    render(<NotificationPanel initialNotifications={MOCK_NOTIFICATIONS} />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Test Alert 1")).toBeInTheDocument();
    expect(screen.getByText("Test Alert 2")).toBeInTheDocument();
    expect(screen.getByText("1 new")).toBeInTheDocument();
  });

  it("marks all notifications as read when clicking Mark all read", () => {
    render(<NotificationPanel initialNotifications={MOCK_NOTIFICATIONS} />);

    const markAllBtn = screen.getByRole("button", { name: /mark all notifications as read/i });
    fireEvent.click(markAllBtn);

    expect(screen.queryByText("1 new")).not.toBeInTheDocument();
  });

  it("clears all notifications and presents undo toast window", () => {
    render(<NotificationPanel initialNotifications={MOCK_NOTIFICATIONS} />);

    const clearAllBtn = screen.getByRole("button", { name: /clear all notifications/i });
    fireEvent.click(clearAllBtn);

    expect(screen.queryByText("Test Alert 1")).not.toBeInTheDocument();
    expect(screen.getByText("No notifications to display.")).toBeInTheDocument();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Notifications cleared.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo clear all notifications/i })).toBeInTheDocument();
  });

  it("restores exact prior notification list when clicking Undo", () => {
    render(<NotificationPanel initialNotifications={MOCK_NOTIFICATIONS} />);

    fireEvent.click(screen.getByRole("button", { name: /clear all notifications/i }));
    expect(screen.queryByText("Test Alert 1")).not.toBeInTheDocument();

    const undoBtn = screen.getByRole("button", { name: /undo clear all notifications/i });
    fireEvent.click(undoBtn);

    expect(screen.getByText("Test Alert 1")).toBeInTheDocument();
    expect(screen.getByText("Test Alert 2")).toBeInTheDocument();
    expect(screen.getByText("1 new")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("dismisses undo toast automatically after timer expires", () => {
    render(<NotificationPanel initialNotifications={MOCK_NOTIFICATIONS} undoDurationMs={3000} />);

    fireEvent.click(screen.getByRole("button", { name: /clear all notifications/i }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("No notifications to display.")).toBeInTheDocument();
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
