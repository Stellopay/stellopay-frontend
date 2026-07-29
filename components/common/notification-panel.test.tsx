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
});
