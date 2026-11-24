import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { axe } from "vitest-axe";
import NotificationPanel, {
  CATEGORY_STORAGE_KEY,
  VIRTUALIZATION_THRESHOLD,
} from "./notification-panel";
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

  // ── View all link (migrated from the removed components/NotificationPanel) ──

  describe("view all link", () => {
    it("links to the notifications page by default", () => {
      render(<NotificationPanel notifications={MOCK_NOTIFICATIONS} now={NOW} />);

      expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute(
        "href",
        "/notifications",
      );
    });

    it("calls onClose when the link is followed so a host dropdown closes", () => {
      const onClose = vi.fn();
      render(
        <NotificationPanel notifications={MOCK_NOTIFICATIONS} onClose={onClose} now={NOW} />,
      );

      const link = screen.getByRole("link", { name: /view all/i });
      // Prevent jsdom navigation; we only care that the panel reports closing.
      link.addEventListener("click", (e) => e.preventDefault());
      fireEvent.click(link);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("is hidden when viewAllHref is null", () => {
      render(
        <NotificationPanel notifications={MOCK_NOTIFICATIONS} viewAllHref={null} now={NOW} />,
      );

      expect(screen.queryByRole("link", { name: /view all/i })).not.toBeInTheDocument();
    });
  });

  // ── Category filtering ─────────────────────────────────────────────

  describe("category filtering", () => {
    const CATEGORISED: NotificationItem[] = [
      { id: "p1", title: "Payment in", message: "m", read: false, category: "payments" },
      // Legacy singular category from the removed type is treated as payments.
      { id: "p2", title: "Payment legacy", message: "m", read: false, category: "payment" },
      { id: "s1", title: "New login", message: "m", read: true, category: "security" },
      { id: "y1", title: "Maintenance", message: "m", read: true, category: "system" },
      { id: "g1", title: "Payroll run", message: "m", read: true, category: "payroll" },
    ];

    it("shows a count per category, folding 'payment' into Payments", () => {
      render(<NotificationPanel notifications={CATEGORISED} now={NOW} />);

      expect(screen.getByTestId("count-all")).toHaveTextContent("(5)");
      expect(screen.getByTestId("count-payments")).toHaveTextContent("(2)");
      expect(screen.getByTestId("count-security")).toHaveTextContent("(1)");
      expect(screen.getByTestId("count-system")).toHaveTextContent("(1)");
    });

    it("filters the list when a category tab is selected", () => {
      render(<NotificationPanel notifications={CATEGORISED} now={NOW} />);

      fireEvent.click(screen.getByRole("tab", { name: /payments/i }));

      expect(screen.getByRole("tab", { name: /payments/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      const titles = screen.getAllByRole("option").map((o) => o.textContent);
      expect(titles).toHaveLength(2);
      expect(screen.getByText("Payment in")).toBeInTheDocument();
      expect(screen.getByText("Payment legacy")).toBeInTheDocument();
      expect(screen.queryByText("New login")).not.toBeInTheDocument();
    });

    it("shows the empty state when a category has no matches", () => {
      render(
        <NotificationPanel notifications={CATEGORISED.slice(0, 2)} now={NOW} />,
      );

      fireEvent.click(screen.getByRole("tab", { name: /security/i }));
      expect(screen.getByText("No notifications to display.")).toBeInTheDocument();
    });

    it("moves selection and focus between tabs with the arrow keys", () => {
      render(<NotificationPanel notifications={CATEGORISED} now={NOW} />);
      const allTab = screen.getByRole("tab", { name: /all/i });

      fireEvent.keyDown(allTab, { key: "ArrowRight" });
      const paymentsTab = screen.getByRole("tab", { name: /payments/i });
      expect(paymentsTab).toHaveAttribute("aria-selected", "true");
      expect(document.activeElement).toBe(paymentsTab);

      fireEvent.keyDown(paymentsTab, { key: "ArrowLeft" });
      fireEvent.keyDown(screen.getByRole("tab", { name: /all/i }), { key: "ArrowLeft" });
      const systemTab = screen.getByRole("tab", { name: /system/i });
      expect(systemTab).toHaveAttribute("aria-selected", "true");
      expect(document.activeElement).toBe(systemTab);
    });

    it("persists the selected category for the session", () => {
      const { unmount } = render(
        <NotificationPanel notifications={CATEGORISED} now={NOW} />,
      );
      fireEvent.click(screen.getByRole("tab", { name: /security/i }));
      expect(sessionStorage.getItem(CATEGORY_STORAGE_KEY)).toBe("security");
      unmount();

      render(<NotificationPanel notifications={CATEGORISED} now={NOW} />);
      expect(screen.getByRole("tab", { name: /security/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("ignores an unknown persisted category", () => {
      sessionStorage.setItem(CATEGORY_STORAGE_KEY, "bogus");
      render(<NotificationPanel notifications={CATEGORISED} now={NOW} />);

      expect(screen.getByRole("tab", { name: /all/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("links each tab to the list it controls", () => {
      render(<NotificationPanel notifications={CATEGORISED} now={NOW} />);
      const listbox = screen.getByRole("listbox");

      for (const tab of screen.getAllByRole("tab")) {
        expect(tab).toHaveAttribute("aria-controls", listbox.id);
      }
    });
  });

  // ── Clear all + undo after filtering ───────────────────────────────

  it("restores every category after clear-all and undo", () => {
    render(
      <NotificationPanel
        notifications={[
          { id: "a", title: "A", message: "m", read: false, category: "payments" },
          { id: "b", title: "B", message: "m", read: false, category: "security" },
        ]}
        now={NOW}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /clear all notifications/i }));
    expect(screen.getByTestId("count-all")).toHaveTextContent("(0)");

    fireEvent.click(screen.getByRole("button", { name: /undo clear all notifications/i }));
    expect(screen.getByTestId("count-all")).toHaveTextContent("(2)");
    expect(screen.getByTestId("count-security")).toHaveTextContent("(1)");
  });

  // ── Virtualization (migrated from the removed components/NotificationPanel) ──

  describe("virtualization", () => {
    it("renders every item without spacers at or below the threshold", () => {
      render(
        <NotificationPanel
          notifications={buildNotifications(VIRTUALIZATION_THRESHOLD)}
          now={NOW}
        />,
      );

      expect(screen.getAllByRole("option")).toHaveLength(VIRTUALIZATION_THRESHOLD);
      expect(screen.queryByTestId("virtual-spacer-top")).not.toBeInTheDocument();
    });

    it("renders only a window of rows above the threshold", () => {
      render(<NotificationPanel notifications={buildNotifications(200)} now={NOW} />);

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(30);
      expect(screen.getByText("Title 0")).toBeInTheDocument();
      expect(screen.queryByText("Title 199")).not.toBeInTheDocument();
      expect(screen.getByTestId("virtual-spacer-bottom")).toBeInTheDocument();
    });

    it("exposes the full list size to assistive tech", () => {
      render(<NotificationPanel notifications={buildNotifications(50)} now={NOW} />);

      const [first] = screen.getAllByRole("option");
      expect(first).toHaveAttribute("aria-setsize", "50");
      expect(first).toHaveAttribute("aria-posinset", "1");
    });

    it("renders later rows when the list is scrolled", () => {
      render(<NotificationPanel notifications={buildNotifications(200)} now={NOW} />);
      const listbox = screen.getByRole("listbox");

      fireEvent.scroll(listbox, { target: { scrollTop: 100 * 88 } });

      expect(screen.getByText("Title 100")).toBeInTheDocument();
      expect(screen.queryByText("Title 0")).not.toBeInTheDocument();
    });

    it("keeps keyboard navigation working for rows outside the window", () => {
      render(<NotificationPanel notifications={buildNotifications(200)} now={NOW} />);
      const listbox = screen.getByRole("listbox");

      fireEvent.keyDown(listbox, { key: "End" });

      const last = screen.getByText("Title 199").closest('[role="option"]');
      expect(last).toHaveAttribute("tabIndex", "0");
      expect(last).toHaveAttribute("aria-posinset", "200");
      expect(document.activeElement).toBe(last);

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      const first = screen.getByText("Title 0").closest('[role="option"]');
      expect(document.activeElement).toBe(first);
    });

    it("does not virtualize in date-grouped mode", () => {
      render(
        <NotificationPanel notifications={buildNotifications(30)} groupByDate now={NOW} />,
      );

      expect(screen.getAllByRole("option")).toHaveLength(30);
      expect(screen.queryByTestId("virtual-spacer-top")).not.toBeInTheDocument();
    });
  });

  // ── Date grouping ──────────────────────────────────────────────────

  describe("date grouping", () => {
    const localNow = new Date(2026, 6, 30, 12, 0, 0);
    const GROUPED: NotificationItem[] = [
      { id: "old", title: "Older", message: "m", read: true, timestamp: new Date(2026, 6, 20).toISOString() },
      { id: "today", title: "This morning", message: "m", read: false, timestamp: new Date(2026, 6, 30, 8).toISOString() },
      { id: "yday", title: "Last night", message: "m", read: false, timestamp: new Date(2026, 6, 29, 22).toISOString() },
    ];

    it("renders labelled Today / Yesterday / Earlier groups in order", () => {
      render(<NotificationPanel notifications={GROUPED} groupByDate now={localNow} />);

      const groups = screen.getAllByRole("group");
      expect(groups.map((g) => g.getAttribute("aria-labelledby") && document.getElementById(g.getAttribute("aria-labelledby")!)?.textContent)).toEqual([
        "Today",
        "Yesterday",
        "Earlier",
      ]);
      expect(within(screen.getByRole("group", { name: "Today" })).getByText("This morning")).toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: "Yesterday" })).getByText("Last night")).toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: "Earlier" })).getByText("Older")).toBeInTheDocument();
    });

    it("hides groups with no notifications", () => {
      render(
        <NotificationPanel notifications={[GROUPED[1]]} groupByDate now={localNow} />,
      );

      expect(screen.getByRole("group", { name: "Today" })).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Yesterday" })).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Earlier" })).not.toBeInTheDocument();
    });

    it("navigates across group boundaries in display order", () => {
      render(<NotificationPanel notifications={GROUPED} groupByDate now={localNow} />);
      const listbox = screen.getByRole("listbox");

      fireEvent.keyDown(listbox, { key: "ArrowDown" });
      expect(document.activeElement).toBe(
        screen.getByText("Last night").closest('[role="option"]'),
      );
      fireEvent.keyDown(listbox, { key: "End" });
      expect(document.activeElement).toBe(
        screen.getByText("Older").closest('[role="option"]'),
      );
    });

    it("renders the panel title as an h1 when requested", () => {
      render(
        <NotificationPanel notifications={GROUPED} groupByDate headingAs="h1" now={localNow} />,
      );

      expect(screen.getAllByRole("heading")).toEqual([
        screen.getByRole("heading", { level: 1, name: "Notifications" }),
      ]);
    });
  });

  // ── Error state ────────────────────────────────────────────────────

  describe("error state", () => {
    it("shows the message as an alert instead of the list", () => {
      render(<NotificationPanel notifications={[]} error="Couldn't load notifications." />);

      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load notifications.");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
    });

    it("offers a retry action only when onRetry is provided", () => {
      const onRetry = vi.fn();
      const { rerender } = render(
        <NotificationPanel notifications={[]} error="Failed" />,
      );
      expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();

      rerender(<NotificationPanel notifications={[]} error="Failed" onRetry={onRetry} />);
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it("prefers the loading skeleton while a retry is in flight", () => {
      render(<NotificationPanel notifications={[]} error="Failed" isLoading />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────

  describe("accessibility", () => {
    it("does not expose the decorative header bell as a control", () => {
      render(<NotificationPanel notifications={MOCK_NOTIFICATIONS} now={NOW} />);

      expect(
        screen.queryByRole("button", { name: /^notifications$/i }),
      ).not.toBeInTheDocument();
    });

    it("does not prevent Escape from reaching the page when there is no onClose", () => {
      render(<NotificationPanel notifications={buildNotifications(2)} now={NOW} />);

      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      screen.getByRole("listbox").dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });

    it("gives each mounted panel unique element ids", () => {
      render(
        <>
          <NotificationPanel notifications={buildNotifications(2)} now={NOW} />
          <NotificationPanel notifications={buildNotifications(2)} now={NOW} />
        </>,
      );

      const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("has no axe violations with notifications", async () => {
      const { container } = render(
        <NotificationPanel notifications={buildNotifications(3)} now={NOW} />,
      );
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("has no axe violations in date-grouped mode", async () => {
      const { container } = render(
        <NotificationPanel
          notifications={buildNotifications(3)}
          groupByDate
          headingAs="h1"
          now={NOW}
        />,
      );
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });
});
