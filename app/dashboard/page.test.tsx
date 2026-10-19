import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

import DashboardPage, { useNotifications, NotificationProvider } from "./page";
import Dashboard from "@/components/dashboard/dashboard-page";

// Mock the Dashboard component to avoid rendering the entire dashboard
vi.mock("@/components/dashboard/dashboard-page", () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));

// Mock the notifications store
vi.mock("@/lib/notifications-store", () => ({
  useNotificationsStore: vi.fn(),
  invalidateNotifications: vi.fn(),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Dashboard component wrapped in NotificationProvider", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: null,
      status: "loading",
      error: null,
    });

    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });

  it("renders without errors when notifications store returns valid data", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: [
        {
          id: "1",
          message: "Test notification",
          read: false,
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      ],
      status: "success",
      error: null,
    });

    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });
});

describe("useNotifications hook", () => {
  it("throws an error when used outside NotificationProvider", () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      const TestComponent = () => {
        useNotifications();
        return <div>Test</div>;
      };
      render(<TestComponent />);
    }).toThrow("useNotifications must be used within a NotificationProvider");

    console.error = consoleError;
  });

  it("returns context value when used within NotificationProvider", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: [{ id: "1", message: "Test", read: false, createdAt: "2023-01-01T00:00:00.000Z" }],
      status: "success",
      error: null,
    });

    const TestComponent = () => {
      const context = useNotifications();
      return <div data-testid="context">{JSON.stringify(context)}</div>;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const context = screen.getByTestId("context");
    expect(context).toBeInTheDocument();
    const parsed = JSON.parse(context.textContent || "{}");
    expect(parsed).toHaveProperty("notifications");
    expect(parsed).toHaveProperty("loading");
    expect(parsed).toHaveProperty("error");
    expect(parsed).toHaveProperty("invalidate");
  });
});

describe("NotificationProvider", () => {
  it("provides loading state when status is loading", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: null,
      status: "loading",
      error: null,
    });

    const TestComponent = () => {
      const { loading } = useNotifications();
      return <div data-testid="loading-state">{loading ? "loading" : "not-loading"}</div>;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
  });

  it("provides error message when error is present", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    const testError = new Error("Failed to fetch notifications");
    useNotificationsStore.mockReturnValue({
      data: null,
      status: "error",
      error: testError,
    });

    const TestComponent = () => {
      const { error } = useNotifications();
      return <div data-testid="error-state">{error || "no-error"}</div>;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId("error-state")).toHaveTextContent("Failed to fetch notifications");
  });

  it("provides notifications data when status is success", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    const mockData = [
      { id: "1", message: "Notification 1", read: false, createdAt: "2023-01-01T00:00:00.000Z" },
      { id: "2", message: "Notification 2", read: true, createdAt: "2023-01-02T00:00:00.000Z" },
    ];
    useNotificationsStore.mockReturnValue({
      data: mockData,
      status: "success",
      error: null,
    });

    const TestComponent = () => {
      const { notifications } = useNotifications();
      return (
        <div data-testid="notifications-count">
          {notifications ? notifications.length : 0}
        </div>
      );
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId("notifications-count")).toHaveTextContent("2");
  });

  it("provides invalidate function", () => {
    const { useNotificationsStore, invalidateNotifications } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: null,
      status: "loading",
      error: null,
    });

    const TestComponent = () => {
      const { invalidate } = useNotifications();
      return (
        <button data-testid="invalidate-btn" onClick={invalidate}>
          Invalidate
        </button>
      );
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const button = screen.getByTestId("invalidate-btn");
    button.click();
    expect(invalidateNotifications).toHaveBeenCalled();
  });

  it("handles null error gracefully", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: null,
      status: "success",
      error: null,
    });

    const TestComponent = () => {
      const { error } = useNotifications();
      return <div data-testid="error-state">{error ?? "null"}</div>;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId("error-state")).toHaveTextContent("null");
  });

  it("handles error without message property", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: null,
      status: "error",
      error: { customError: true } as unknown as Error,
    });

    const TestComponent = () => {
      const { error } = useNotifications();
      return <div data-testid="error-state">{error ?? "no-error"}</div>;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId("error-state")).toHaveTextContent("no-error");
  });

  it("does not throw unhandled rejections when notifications store fails", () => {
    const { useNotificationsStore } = require("@/lib/notifications-store");
    useNotificationsStore.mockReturnValue({
      data: null,
      status: "error",
      error: new Error("Network error"),
    });

    const TestComponent = () => {
      const { error, loading } = useNotifications();
      return (
        <div>
          <div data-testid="error">{error}</div>
          <div data-testid="loading">{String(loading)}</div>
        </div>
      );
    };

    expect(() => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
});
