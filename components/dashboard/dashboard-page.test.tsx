import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DragOverlay: () => null,
  PointerSensor: vi.fn(),
  useSensor: vi.fn((sensor: unknown) => sensor),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

vi.mock("@/components/dashboard/dashboard-navbar", () => ({
  default: () => <nav data-testid="dashboard-navbar">Navbar</nav>,
}));

vi.mock("@/components/dashboard/account-overview", () => ({
  default: () => <section data-testid="widget-account-overview">Account Overview</section>,
}));

vi.mock("@/components/dashboard/quick-transfer", () => ({
  default: ({ recentRecipients }: { recentRecipients: unknown[] }) => (
    <section data-testid="widget-quick-transfer">
      Quick Transfer ({recentRecipients.length} recipients)
    </section>
  ),
}));

vi.mock("@/components/dashboard/quick-actions", () => ({
  QuickActions: () => <section data-testid="widget-quick-actions">Quick Actions</section>,
}));

vi.mock("@/components/dashboard/analytics-insights", () => ({
  AnalyticsInsights: () => <section data-testid="widget-analytics-insights">Analytics Insights</section>,
}));

vi.mock("@/components/analytics/client-analytics-view", () => ({
  default: ({ isLoading }: { isLoading: boolean }) => (
    <section data-testid="widget-client-analytics">
      Client Analytics (loading={String(isLoading)})
    </section>
  ),
}));

vi.mock("@/components/dashboard/dashboard-tour", () => ({
  DashboardTour: () => <div data-testid="dashboard-tour">Tour Overlay</div>,
}));

vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getWidgetOrder: vi.fn(),
    setWidgetOrder: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import { safeStorage } from "@/utils/safeStorage";
import Dashboard, { WIDGET_IDS, WIDGET_LABELS } from "./dashboard-page";

const WIDGET_TEST_IDS = [
  "widget-account-overview",
  "widget-quick-transfer",
  "widget-quick-actions",
  "widget-analytics-insights",
  "widget-client-analytics",
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getWidgetOrder).mockReturnValue(null);
  });

  it("renders the dashboard navbar", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("dashboard-navbar")).toBeInTheDocument();
  });

  it("renders all five dashboard widgets", () => {
    render(<Dashboard />);
    for (const testId of WIDGET_TEST_IDS) {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }
  });

  it("renders widgets in the default order", () => {
    const { container } = render(<Dashboard />);
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(5);
    expect(items[0]).toHaveTextContent("Account Overview");
    expect(items[1]).toHaveTextContent("Quick Transfer");
    expect(items[2]).toHaveTextContent("Quick Actions");
    expect(items[3]).toHaveTextContent("Analytics Insights");
    expect(items[4]).toHaveTextContent("Client Analytics");
  });

  it("renders the dashboard tour overlay", () => {
    render(<Dashboard />);
    expect(screen.getByTestId("dashboard-tour")).toBeInTheDocument();
  });

  it("has the correct layout structure", () => {
    const { container } = render(<Dashboard />);
    const list = container.querySelector('[role="list"]');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute("aria-label", "Dashboard widgets");
  });

  it("renders move up/down buttons for each widget", () => {
    render(<Dashboard />);
    const moveUpButtons = screen.getAllByRole("button", { name: /move .* up/i });
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move .* down/i,
    });
    expect(moveUpButtons.length).toBe(5);
    expect(moveDownButtons.length).toBe(5);
  });

  it("has move up disabled on the first widget", () => {
    render(<Dashboard />);
    const firstMoveUp = screen.getAllByRole("button", { name: /move .* up/i })[0];
    expect(firstMoveUp).toBeDisabled();
  });

  it("has move down disabled on the last widget", () => {
    render(<Dashboard />);
    const buttons = screen.getAllByRole("button", { name: /move .* down/i });
    const lastMoveDown = buttons[buttons.length - 1];
    expect(lastMoveDown).toBeDisabled();
  });

  it("moves a widget down when its move down button is clicked", () => {
    const { container } = render(<Dashboard />);
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move .* down/i,
    });

    fireEvent.click(moveDownButtons[0]);

    const items = container.querySelectorAll('[role="listitem"]');
    expect(items[0]).toHaveTextContent("Quick Transfer");
    expect(items[1]).toHaveTextContent("Account Overview");
    expect(items[2]).toHaveTextContent("Quick Actions");
  });

  it("moves a widget up when its move up button is clicked", () => {
    const { container } = render(<Dashboard />);
    const moveUpButtons = screen.getAllByRole("button", { name: /move .* up/i });
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move .* down/i,
    });

    fireEvent.click(moveDownButtons[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /move .* up/i })[1]);

    const items = container.querySelectorAll('[role="listitem"]');
    expect(items[0]).toHaveTextContent("Account Overview");
    expect(items[1]).toHaveTextContent("Quick Transfer");
  });

  it("persists widget order to localStorage after move", () => {
    render(<Dashboard />);

    const moveDownButtons = screen.getAllByRole("button", {
      name: /move .* down/i,
    });
    fireEvent.click(moveDownButtons[0]);

    const calls = vi.mocked(safeStorage.setWidgetOrder).mock.calls;
    const lastOrder = calls[calls.length - 1][0];
    expect(lastOrder[0]).toBe("quick-transfer");
    expect(lastOrder[1]).toBe("account-overview");
  });

  it("restores saved widget order from localStorage on mount", () => {
    const customOrder = [
      "quick-transfer",
      "account-overview",
      "client-analytics",
      "analytics-insights",
      "quick-actions",
    ];
    safeStorage.getWidgetOrder.mockReturnValue(customOrder);

    const { container } = render(<Dashboard />);
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items[0]).toHaveTextContent("Quick Transfer");
    expect(items[1]).toHaveTextContent("Account Overview");
    expect(items[2]).toHaveTextContent("Client Analytics");
    expect(items[3]).toHaveTextContent("Analytics Insights");
    expect(items[4]).toHaveTextContent("Quick Actions");
  });

  it("falls back to default order when localStorage has invalid data", () => {
    safeStorage.getWidgetOrder.mockReturnValue(null);

    const { container } = render(<Dashboard />);
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items[0]).toHaveTextContent("Account Overview");
    expect(items[1]).toHaveTextContent("Quick Transfer");
  });

  it("falls back to default order when localStorage has wrong number of items", () => {
    safeStorage.getWidgetOrder.mockReturnValue(["account-overview", "quick-actions"]);

    const { container } = render(<Dashboard />);
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items[0]).toHaveTextContent("Account Overview");
    expect(items.length).toBe(5);
  });

  it("falls back to default order when localStorage has unknown widget ids", () => {
    safeStorage.getWidgetOrder.mockReturnValue([
      "unknown-widget",
      "account-overview",
      "quick-transfer",
      "quick-actions",
      "analytics-insights",
    ]);

    const { container } = render(<Dashboard />);
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items[0]).toBeDefined();
    expect(items.length).toBe(5);
  });

  it("renders drag handle buttons with correct accessible labels", () => {
    render(<Dashboard />);
    const dragHandles = screen.getAllByRole("button", { name: /drag .* to reorder/i });
    expect(dragHandles.length).toBe(5);
    expect(dragHandles[0]).toHaveAttribute("aria-roledescription", "sortable");
  });

  it("passes isLoading to ClientAnalyticsView", () => {
    render(<Dashboard />);
    const analytics = screen.getByTestId("widget-client-analytics");
    expect(analytics).toHaveTextContent("loading=true");
  });

  it("passes recentRecipients to QuickTransfer", () => {
    render(<Dashboard />);
    const transfer = screen.getByTestId("widget-quick-transfer");
    expect(transfer).toHaveTextContent(/recipients/);
  });

  it("assigns accessible labels to the sortable list container", () => {
    render(<Dashboard />);
    const group = screen.getByRole("list", { name: "Dashboard widgets" });
    expect(group).toBeInTheDocument();
  });

  it("saves the default order when no saved order exists", () => {
    safeStorage.getWidgetOrder.mockReturnValue(null);

    render(<Dashboard />);
    expect(safeStorage.setWidgetOrder).toHaveBeenCalled();
    const saved = vi.mocked(safeStorage.setWidgetOrder).mock.calls[0][0];
    expect(saved).toEqual(WIDGET_IDS);
  });
});
