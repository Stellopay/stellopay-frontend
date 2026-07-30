import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import NotificationPanel from "./notification-panel";
import type { NotificationItem } from "@/types/notification-item";

const NOW = new Date("2026-07-30T12:00:00.000Z");

const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "test-1",
    title: "Test Alert 1",
    message: "First test message",
    timestamp: ago(MINUTE),
    read: false,
  },
  {
    id: "test-2",
    title: "Test Alert 2",
    message: "Second test message",
    timestamp: ago(10 * MINUTE),
    read: true,
  },
];

const buildNotifications = (count: number): NotificationItem[] =>
  Array.from({ length: count }).map((_, index) => {
    const isRead = index % 2 === 0;
    return {
      id: `notif-${index}`,
      title: `Title ${index}`,
      message: `Message ${index}`,
      timestamp: ago((index + 1) * HOUR),
      read: isRead,
      ...(isRead ? { readAt: ago(index * MINUTE) } : {}),
    };
  });

describe("NotificationPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("renders a loading skeleton when isLoading is true", () => {
    render(<NotificationPanel notifications={[]} isLoading />);

    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders notification items and unread count correctly", () => {
    render(<NotificationPanel notifications={MOCK_NOTIFICATIONS} now={NOW} />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Test Alert 1")).toBeInTheDocument();
    expect(screen.getByText("Test Alert 2")).toBeInTheDocument();
    expect(screen.getByText("1 new")).toBeInTheDocument();
  });

  it("marks all notifications as read when clicking Mark all read", () => {
    render(<NotificationPanel notifications={MOCK_NOTIFICATIONS} now={NOW} />);

    fireEvent.click(
      screen.getByRole("button", { name: /mark all notifications as read/i }),
    );

    expect(screen.queryByText("1 new")).not.toBeInTheDocument();
  });

  // ── Clear all with undo ────────────────────────────────────────────

  describe("clear all with undo", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    it("clears all notifications and presents undo toast window", () => {
      render(<NotificationPanel notifications={MOCK_NOTIFICATIONS} now={NOW} />);

      fireEvent.click(
        screen.getByRole("button", { name: /clear all notifications/i }),
      );

      expect(screen.queryByText("Test Alert 1")).not.toBeInTheDocument();
      expect(screen.getByText("No notifications to display.")).toBeInTheDocument();

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Notifications cleared.")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /undo clear all notifications/i }),
      ).toBeInTheDocument();
    });

    it("restores exact prior notification list when clicking Undo", () => {
      render(<NotificationPanel notifications={MOCK_NOTIFICATIONS} now={NOW} />);

      fireEvent.click(
        screen.getByRole("button", { name: /clear all notifications/i }),
      );
      expect(screen.queryByText("Test Alert 1")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /undo clear all notifications/i }),
      );

      expect(screen.getByText("Test Alert 1")).toBeInTheDocument();
      expect(screen.getByText("Test Alert 2")).toBeInTheDocument();
      expect(screen.getByText("1 new")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("dismisses undo toast automatically after timer expires", () => {
      render(
        <NotificationPanel
          notifications={MOCK_NOTIFICATIONS}
          undoDurationMs={3000}
          now={NOW}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /clear all notifications/i }),
      );
      expect(screen.getByRole("status")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByText("No notifications to display.")).toBeInTheDocument();
    });

    it("dismisses the toast without restoring when the close button is used", () => {
      render(<NotificationPanel notifications={MOCK_NOTIFICATIONS} now={NOW} />);

      fireEvent.click(
        screen.getByRole("button", { name: /clear all notifications/i }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: /dismiss notification undo message/i }),
      );

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByText("Test Alert 1")).not.toBeInTheDocument();
    });
  });

  // ── Relative timestamps ────────────────────────────────────────────

  describe("relative timestamps", () => {
    const renderWithTimestamp = (timestamp?: string) =>
      render(
        <NotificationPanel
          notifications={[
            { id: "t", title: "Timed", message: "msg", read: false, timestamp },
          ]}
          now={NOW}
        />,
      );

    it.each([
      ["just now", ago(30_000)],
      ["5m ago", ago(5 * MINUTE)],
      ["2h ago", ago(2 * HOUR)],
      ["yesterday", ago(DAY)],
      ["3d ago", ago(3 * DAY)],
    ])("renders %s for the matching age", (expected, timestamp) => {
      renderWithTimestamp(timestamp);

      const time = screen.getByTestId("notification-timestamp");
      expect(within(time).getByText(expected)).toBeInTheDocument();
    });

    it("falls back to an absolute date beyond the 7 day threshold", () => {
      renderWithTimestamp(ago(8 * DAY));

      const time = screen.getByTestId("notification-timestamp");
      expect(within(time).getByText("Jul 22, 2026")).toBeInTheDocument();
    });

    it("exposes the absolute timestamp via the title attribute", () => {
      renderWithTimestamp("2026-07-29T15:00:00.000Z");

      const time = screen.getByTestId("notification-timestamp");
      expect(time).toHaveAttribute("title", expect.stringContaining("Jul 29, 2026"));
    });

    it("emits a machine-readable ISO dateTime attribute", () => {
      renderWithTimestamp("2026-07-29T15:00:00.000Z");

      expect(screen.getByTestId("notification-timestamp")).toHaveAttribute(
        "dateTime",
        "2026-07-29T15:00:00.000Z",
      );
    });

    it("pairs the relative text with a screen-reader-only absolute label", () => {
      renderWithTimestamp(ago(2 * HOUR));

      const time = screen.getByTestId("notification-timestamp");
      expect(within(time).getByText("2h ago")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(time.querySelector(".sr-only")?.textContent).toContain("Jul 30, 2026");
    });

    it("renders nothing when the notification has no timestamp", () => {
      renderWithTimestamp(undefined);

      expect(screen.queryByTestId("notification-timestamp")).not.toBeInTheDocument();
    });

    it("renders nothing when the timestamp is unparsable", () => {
      renderWithTimestamp("not-a-date");

      expect(screen.queryByTestId("notification-timestamp")).not.toBeInTheDocument();
    });

    it("renders a relative time for every notification in the list", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);

      expect(screen.getAllByTestId("notification-timestamp")).toHaveLength(3);
    });
  });

  it("displays the readAt timestamp for read notifications if provided", () => {
    const notifications: NotificationItem[] = [
      {
        id: "read",
        title: "Read item",
        message: "msg",
        read: true,
        readAt: "2026-07-29T15:00:00Z",
      },
    ];
    render(<NotificationPanel notifications={notifications} now={NOW} />);

    expect(screen.getByText(/Read:/)).toBeInTheDocument();
  });

  it("omits the readAt line when the notification is unread", () => {
    render(
      <NotificationPanel
        notifications={[
          { id: "u", title: "Unread", message: "msg", read: false },
        ]}
        now={NOW}
      />,
    );

    expect(screen.queryByText(/Read:/)).not.toBeInTheDocument();
  });

  // ── Keyboard navigation ────────────────────────────────────────────

  describe("keyboard navigation", () => {
    it("applies listbox role and aria-label to the notification list", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);

      expect(
        screen.getByRole("listbox", { name: "Notifications list" }),
      ).toBeInTheDocument();
    });

    it("gives tabIndex={0} to the first item and tabIndex={-1} to others by default", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      const options = screen.getAllByRole("option");

      expect(options[0]).toHaveAttribute("tabIndex", "0");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
      expect(options[2]).toHaveAttribute("tabIndex", "-1");
    });

    it("updates tabIndex when ArrowDown is pressed", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      const listbox = screen.getByRole("listbox");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("tabIndex", "-1");
      expect(options[1]).toHaveAttribute("tabIndex", "0");
      expect(options[2]).toHaveAttribute("tabIndex", "-1");
    });

    it("moves focus forward with ArrowDown and backward with ArrowUp", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      expect(options[1]).toHaveAttribute("tabIndex", "0");

      fireEvent.keyDown(listbox, { key: "ArrowUp" });
      expect(options[0]).toHaveAttribute("tabIndex", "0");
    });

    it("wraps from last to first on ArrowDown", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "End" });
      expect(options[2]).toHaveAttribute("tabIndex", "0");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      expect(options[0]).toHaveAttribute("tabIndex", "0");
    });

    it("wraps from first to last on ArrowUp", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "ArrowUp" });
      expect(options[2]).toHaveAttribute("tabIndex", "0");
    });

    it("jumps to first item on Home", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      fireEvent.keyDown(listbox, { key: "Home" });
      expect(options[0]).toHaveAttribute("tabIndex", "0");
    });

    it("jumps to last item on End", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      const listbox = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");

      fireEvent.keyDown(listbox, { key: "End" });
      expect(options[2]).toHaveAttribute("tabIndex", "0");
    });

    it("sets aria-selected on the focused item", () => {
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
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
          now={NOW}
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
          now={NOW}
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
          now={NOW}
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
          now={NOW}
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
          now={NOW}
        />,
      );

      fireEvent.keyDown(screen.getAllByRole("option")[0], { key: "a" });
      expect(onNotificationClick).not.toHaveBeenCalled();
    });

    it("resets focusedIndex when notifications change", () => {
      const notifications = buildNotifications(3);
      const { rerender } = render(
        <NotificationPanel notifications={notifications} now={NOW} />,
      );
      const listbox = screen.getByRole("listbox");

      fireEvent.keyDown(listbox, { key: "End" });
      expect(screen.getAllByRole("option")[2]).toHaveAttribute("tabIndex", "0");

      rerender(<NotificationPanel notifications={buildNotifications(2)} now={NOW} />);
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
      render(<NotificationPanel notifications={buildNotifications(3)} now={NOW} />);
      expect(screen.getAllByRole("option")).toHaveLength(3);
    });

    it("applies cursor-pointer and focus-visible ring to options", () => {
      render(<NotificationPanel notifications={buildNotifications(1)} now={NOW} />);
      const option = screen.getByRole("option");

      expect(option.className).toContain("cursor-pointer");
      expect(option.className).toContain("focus-visible:ring-2");
    });
  });
});
