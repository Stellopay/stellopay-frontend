import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AnalyticsChart, { CustomTooltip } from "./analytics-chart";

vi.mock("recharts", () => {
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({
      children,
      data,
    }: {
      children: React.ReactNode;
      data: unknown;
    }) => (
      <div data-testid="bar-chart" data-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: ({ dataKey, fill, barSize }: { dataKey: string; fill?: string; barSize?: number }) => (
      <div data-testid="bar" data-key={dataKey} data-fill={fill} data-barsize={barSize} />
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="x-axis" data-key={dataKey} />
    ),
    YAxis: () => <div data-testid="y-axis" />,
    Tooltip: ({
      content,
    }: {
      content: React.ReactElement<Record<string, unknown>>;
    }) => (
      <div data-testid="tooltip">
        {React.cloneElement(content, {
          active: true,
          payload: [{ value: 999 }],
          label: "TestMonth",
        })}
      </div>
    ),
    CartesianGrid: ({ stroke }: { stroke?: string }) => (
      <div data-testid="cartesian-grid" data-stroke={stroke} />
    ),
  };
});

describe("AnalyticsChart Component", () => {
  it("renders empty state without runtime error when data is an empty array", () => {
    render(<AnalyticsChart data={[]} />);

    const emptyContainer = screen.getByTestId("analytics-chart-empty");
    expect(emptyContainer).toBeInTheDocument();
    expect(emptyContainer).toHaveAttribute("role", "status");
    expect(emptyContainer).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("No analytics data available")).toBeInTheDocument();
    expect(
      screen.getByText("There are no data points to display for the selected period.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });

  it("renders empty state without runtime error when data is null or undefined", () => {
    // @ts-expect-error testing null runtime robustness
    render(<AnalyticsChart data={null} />);

    expect(screen.getByTestId("analytics-chart-empty")).toBeInTheDocument();
    expect(screen.getByText("No analytics data available")).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });

  it("renders chart canvas when a non-empty dataset is provided", () => {
    const data = [{ month: "Jan", views: 500 }];
    render(<AnalyticsChart data={data} />);

    expect(screen.queryByTestId("analytics-chart-empty")).not.toBeInTheDocument();
    const barChart = screen.getByTestId("bar-chart");
    expect(barChart).toBeInTheDocument();
    expect(JSON.parse(barChart.getAttribute("data-data") || "[]")).toEqual(data);
  });

  it("applies default chart styling when showNotifications is false", () => {
    const data = [{ month: "Jan", views: 500 }];
    render(<AnalyticsChart data={data} showNotifications={false} />);

    const grid = screen.getByTestId("cartesian-grid");
    expect(grid).toHaveAttribute("data-stroke", "#1f1b2e");

    const bar = screen.getByTestId("bar");
    expect(bar).toHaveAttribute("data-fill", "#2E2E2E");
    expect(bar).toHaveAttribute("data-barsize", "28");
  });

  it("applies notifications chart styling when showNotifications is true", () => {
    const data = [{ month: "Jan", views: 500 }];
    render(<AnalyticsChart data={data} showNotifications={true} />);

    const grid = screen.getByTestId("cartesian-grid");
    expect(grid).toHaveAttribute("data-stroke", "currentColor");

    const bar = screen.getByTestId("bar");
    expect(bar).toHaveAttribute("data-fill", "#3b82f6");
    expect(bar).toHaveAttribute("data-barsize", "20");
  });
});

describe("CustomTooltip Component", () => {
  it("renders label and view count when active with payload", () => {
    render(<CustomTooltip active payload={[{ value: 12345 }]} label="Aug" />);

    expect(screen.getByText("Aug")).toBeInTheDocument();
    expect(screen.getByText("12,345 views")).toBeInTheDocument();
  });

  it("renders null when active is false", () => {
    const { container } = render(<CustomTooltip active={false} payload={[{ value: 100 }]} label="Jan" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders null when payload is empty or undefined", () => {
    const { container } = render(<CustomTooltip active payload={[]} label="Jan" />);
    expect(container).toBeEmptyDOMElement();
  });
});
