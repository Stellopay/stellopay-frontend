import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import AnalyticsViews, { AnalyticsDataPoint } from "./analytics-view";
import ClientAnalyticsView from "./client-analytics-view";

type TooltipContentProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

// Mock recharts
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
    Bar: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="bar" data-key={dataKey} />
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="x-axis" data-key={dataKey} />
    ),
    YAxis: () => <div data-testid="y-axis" />,
    Tooltip: ({ content }: { content: React.ReactElement<TooltipContentProps> }) => (
      <div data-testid="tooltip">
        {React.cloneElement(content, {
          active: true,
          payload: [{ value: 999 }],
          label: "TestMonth",
        })}
        {React.cloneElement(content, {
          active: false,
        })}
      </div>
    ),
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
  };
});

// Mock hooks
const mockUsePaymentHistory = vi.fn();
vi.mock("@/hooks/usePaymentHistory", () => ({
  usePaymentHistory: () => mockUsePaymentHistory(),
}));

describe("AnalyticsViews Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaymentHistory.mockReturnValue({
      data: [
        {
          id: "pay-1",
          paymentDescription: "Subscription Fee",
          paymentId: "PAY-12345",
          history: "Processed on Jun 20",
        },
      ],
      isLoading: false,
      error: null,
    });
  });

  it("renders the loading skeleton when isLoading is true and showNotifications is false", () => {
    render(<AnalyticsViews isLoading={true} showNotifications={false} />);
    expect(screen.getByText("Loading analytics views chart...")).toBeInTheDocument();
  });

  it("renders the loading skeleton when isLoading is true and showNotifications is true", () => {
    render(<AnalyticsViews isLoading={true} showNotifications={true} />);
    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
  });

  it("renders chart with default data when data prop is not provided", () => {
    render(<AnalyticsViews />);
    expect(screen.getByText("Analytics views")).toBeInTheDocument();
    const barChart = screen.getByTestId("bar-chart");
    expect(barChart).toBeInTheDocument();
    const parsedData = JSON.parse(barChart.getAttribute("data-data") || "[]");
    expect(parsedData.length).toBe(12);
    expect(parsedData[0]).toEqual({ month: "Jan", views: 24000 });
  });

  it("renders chart with custom populated data", () => {
    const customData: AnalyticsDataPoint[] = [
      { month: "Jan", views: 100 },
      { month: "Feb", views: 200 },
    ];
    render(<AnalyticsViews data={customData} />);
    const barChart = screen.getByTestId("bar-chart");
    const parsedData = JSON.parse(barChart.getAttribute("data-data") || "[]");
    expect(parsedData).toEqual(customData);
  });

  it("renders chart with empty data", () => {
    render(<AnalyticsViews data={[]} />);
    const barChart = screen.getByTestId("bar-chart");
    const parsedData = JSON.parse(barChart.getAttribute("data-data") || "[]");
    expect(parsedData).toEqual([]);
  });

  it("renders CustomTooltip content correctly inside Tooltip mock", () => {
    render(<AnalyticsViews />);
    expect(screen.getByText("TestMonth")).toBeInTheDocument();
    expect(screen.getByText("999 views")).toBeInTheDocument();
  });

  it("handles year selector dropdown interactions", () => {
    render(<AnalyticsViews showDropdown={true} />);
    
    // Toggle dropdown open
    const dropdownButton = screen.getByText("This Year");
    fireEvent.click(dropdownButton);
    expect(screen.getByText("2024")).toBeInTheDocument();

    // Select 2024
    fireEvent.click(screen.getByText("2024"));
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.queryByText("2023")).not.toBeInTheDocument();
  });

  it("renders notifications sidebar when showNotifications is true", () => {
    render(<AnalyticsViews showNotifications={true} />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Subscription Fee")).toBeInTheDocument();
    expect(screen.getByText("PAY-12345")).toBeInTheDocument();
    expect(screen.getByText("Processed on Jun 20")).toBeInTheDocument();
  });
});

describe("ClientAnalyticsView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaymentHistory.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  it("renders default loading state when isLoading is true", () => {
    render(<ClientAnalyticsView isLoading={true} />);
    expect(screen.getByText("Loading analytics views chart...")).toBeInTheDocument();
  });

  it("renders notifications loading state when isLoading is true and showNotifications is true", () => {
    render(<ClientAnalyticsView isLoading={true} showNotifications={true} />);
    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
  });

  it("renders the loaded AnalyticsViews component after mounting", async () => {
    render(<ClientAnalyticsView />);
    
    // After mounting, the loading state should disappear and the chart should appear
    await waitFor(() => {
      expect(screen.queryByText("Loading analytics views chart...")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Analytics views")).toBeInTheDocument();
  });
});
