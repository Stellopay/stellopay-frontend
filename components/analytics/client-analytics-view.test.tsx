import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, test, describe, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import ClientAnalyticsView from "./client-analytics-view";
import type { AnalyticsDataPoint } from "./analytics-view";

vi.mock("next/dynamic", () => {
  return {
    default: () => {
      const DynamicComponent = () => <div data-testid="analytics-view-mock">Analytics View</div>;
      return DynamicComponent;
    },
  };
});

// Mock Calendar since react-day-picker has complex DOM dependencies
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect, ...props }: any) => (
    <div data-testid="calendar-mock" data-mode={props.mode}>
      <button
        type="button"
        onClick={() =>
          onSelect({
            from: new Date(2026, 5, 1),
            to: new Date(2026, 6, 15),
          })
        }
      >
        Select Custom Range
      </button>
    </div>
  ),
}));

const sampleData: AnalyticsDataPoint[] = [
  { month: "Jan", views: 100 },
  { month: "Feb", views: 200 },
  { month: "Mar", views: 300 },
  { month: "Apr", views: 400 },
  { month: "May", views: 500 },
  { month: "Jun", views: 600 },
  { month: "Jul", views: 700 },
  { month: "Aug", views: 800 },
  { month: "Sept", views: 900 },
  { month: "Oct", views: 1000 },
  { month: "Nov", views: 1100 },
  { month: "Dec", views: 1200 },
];

describe("ClientAnalyticsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("isMounted=false initial render matches the skeleton snapshot", () => {
    // renderToString simulates the initial SSR pass where useEffect hasn't fired
    const html = renderToString(<ClientAnalyticsView isLoading={false} />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatchSnapshot();
  });

  test("renders skeleton when isLoading is true independent of mount state", () => {
    render(<ClientAnalyticsView isLoading={true} />);
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    expect(screen.getByText("Loading analytics views chart...")).toBeInTheDocument();
    expect(screen.queryByTestId("analytics-view-mock")).not.toBeInTheDocument();
  });

  test("renders skeleton with notifications layout when isLoading=true and showNotifications=true", () => {
    render(<ClientAnalyticsView isLoading={true} showNotifications={true} />);
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
  });

  test("renders actual component when isLoading is false and component is mounted", () => {
    render(<ClientAnalyticsView isLoading={false} />);
    // In @testing-library/react, useEffect runs synchronously so isMounted flips to true
    expect(screen.getByTestId("analytics-view-mock")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("is accessible when loading", async () => {
    const { container } = render(<ClientAnalyticsView isLoading={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("is accessible when mounted", async () => {
    const { container } = render(<ClientAnalyticsView isLoading={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("Date range picker", () => {
    test("renders preset buttons when component is mounted", () => {
      render(<ClientAnalyticsView isLoading={false} />);

      expect(screen.getByLabelText("Select 7d date range")).toBeInTheDocument();
      expect(screen.getByLabelText("Select 30d date range")).toBeInTheDocument();
      expect(screen.getByLabelText("Select 90d date range")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Custom date range")).toBeInTheDocument();
    });

    test("default preset is 30d", () => {
      render(<ClientAnalyticsView isLoading={false} />);

      const btn30d = screen.getByLabelText("Select 30d date range");
      expect(btn30d).toHaveAttribute("aria-pressed", "true");
    });

    test("clicking a preset updates the pressed state", () => {
      render(<ClientAnalyticsView isLoading={false} />);

      const btn7d = screen.getByLabelText("Select 7d date range");
      fireEvent.click(btn7d);

      expect(btn7d).toHaveAttribute("aria-pressed", "true");
      const btn30d = screen.getByLabelText("Select 30d date range");
      expect(btn30d).toHaveAttribute("aria-pressed", "false");
    });

    test("clicking Custom opens the calendar popover", () => {
      render(<ClientAnalyticsView isLoading={false} />);

      const customBtn = screen.getByLabelText("Select Custom date range");
      fireEvent.click(customBtn);

      expect(screen.getByTestId("calendar-mock")).toBeInTheDocument();
    });

    test("selecting a custom range from the calendar updates the preset", () => {
      render(<ClientAnalyticsView isLoading={false} />);

      // Open calendar
      const customBtn = screen.getByLabelText("Select Custom date range");
      fireEvent.click(customBtn);

      // Select custom range from mock calendar
      const selectBtn = screen.getByText("Select Custom Range");
      fireEvent.click(selectBtn);

      // Calendar should close
      expect(screen.queryByTestId("calendar-mock")).not.toBeInTheDocument();
      // Custom button should be pressed
      expect(customBtn).toHaveAttribute("aria-pressed", "true");
    });

    test("passes data through to AnalyticsViews when no filtering needed", () => {
      render(<ClientAnalyticsView isLoading={false} data={sampleData} />);

      // The AnalyticsViews mock renders the data-testid="analytics-view-mock" div
      expect(screen.getByTestId("analytics-view-mock")).toBeInTheDocument();
    });

    test("fires onDateRangeChange callback when a preset is selected", () => {
      const onDateRangeChange = vi.fn();
      render(
        <ClientAnalyticsView
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
        />,
      );

      const btn7d = screen.getByLabelText("Select 7d date range");
      fireEvent.click(btn7d);

      expect(onDateRangeChange).toHaveBeenCalledTimes(1);
      expect(onDateRangeChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: "7d" }),
      );
    });

    test("fires onDateRangeChange when a custom range is selected", () => {
      const onDateRangeChange = vi.fn();
      render(
        <ClientAnalyticsView
          isLoading={false}
          onDateRangeChange={onDateRangeChange}
        />,
      );

      // Open calendar
      fireEvent.click(screen.getByLabelText("Select Custom date range"));
      // Select range
      fireEvent.click(screen.getByText("Select Custom Range"));

      expect(onDateRangeChange).toHaveBeenCalledTimes(1);
      expect(onDateRangeChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: "custom" }),
      );
    });

    test("uses controlled dateRange prop when provided", () => {
      const { rerender } = render(
        <ClientAnalyticsView
          isLoading={false}
          dateRange={{ preset: "90d" }}
        />,
      );

      const btn90d = screen.getByLabelText("Select 90d date range");
      expect(btn90d).toHaveAttribute("aria-pressed", "true");

      // Rerender with different controlled range
      rerender(
        <ClientAnalyticsView
          isLoading={false}
          dateRange={{ preset: "7d" }}
        />,
      );

      const btn7d = screen.getByLabelText("Select 7d date range");
      expect(btn7d).toHaveAttribute("aria-pressed", "true");
      expect(btn90d).toHaveAttribute("aria-pressed", "false");
    });
  });
});
