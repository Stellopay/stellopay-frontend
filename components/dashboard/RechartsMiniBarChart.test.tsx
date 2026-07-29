import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RechartsMiniBarChart } from "./RechartsMiniBarChart";

vi.mock("recharts", () => {
  const MockResponsiveContainer = ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="responsive-container">{children}</div>;

  const MockBarChart = ({
    children,
    data,
    margin,
  }: {
    children: React.ReactNode;
    data: unknown;
    margin?: Record<string, number>;
  }) => (
    <div
      data-testid="bar-chart"
      data-data={JSON.stringify(data)}
      data-margin={JSON.stringify(margin)}
    >
      {children}
    </div>
  );

  const MockBar = ({
    dataKey,
    fill,
    radius,
  }: {
    dataKey: string;
    fill?: string;
    radius?: number[];
  }) => (
    <div
      data-testid="bar"
      data-key={dataKey}
      data-fill={fill}
      data-radius={JSON.stringify(radius)}
    />
  );

  const MockXAxis = ({ dataKey, hide }: { dataKey: string; hide?: boolean }) => (
    <div data-testid="x-axis" data-key={dataKey} data-hide={String(hide)} />
  );

  const MockTooltip = ({
    cursor,
    contentStyle,
    formatter,
  }: {
    cursor: boolean | object;
    contentStyle?: React.CSSProperties;
    formatter?: (value: number) => string;
  }) => (
    <div
      data-testid="tooltip"
      data-cursor={String(cursor)}
      data-contentstyle={JSON.stringify(contentStyle)}
      data-formatter-result={formatter ? formatter(42) : undefined}
    />
  );

  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    Bar: MockBar,
    XAxis: MockXAxis,
    Tooltip: MockTooltip,
  };
});

describe("RechartsMiniBarChart", () => {
  const sampleData = [
    { value: 40 },
    { value: 70 },
    { value: 45 },
  ];

  // ── Basic rendering ───────────────────────────────────────────────────

  it("renders a chart when data is provided", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("bar")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
  });

  it("renders empty state when data is an empty array", () => {
    render(<RechartsMiniBarChart data={[]} />);

    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
    expect(
      screen.getByText("No data")
    ).toBeInTheDocument();
  });

  it("uses default fill when no cssVar or color is provided", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const bar = screen.getByTestId("bar");
    expect(bar).toHaveAttribute("data-fill", "var(--chart-1)");
  });

  // ── cssVar prop ───────────────────────────────────────────────────────

  it("uses the cssVar prop to build var(--<name>) fill", () => {
    render(<RechartsMiniBarChart data={sampleData} cssVar="--chart-2" />);

    const bar = screen.getByTestId("bar");
    expect(bar).toHaveAttribute("data-fill", "var(--chart-2)");
  });

  it("ignores color when cssVar is provided", () => {
    render(
      <RechartsMiniBarChart
        data={sampleData}
        cssVar="--chart-3"
        color="#ff0000"
      />
    );

    const bar = screen.getByTestId("bar");
    expect(bar).toHaveAttribute("data-fill", "var(--chart-3)");
  });

  // ── color prop ────────────────────────────────────────────────────────

  it("uses the color prop as static fill when cssVar is not set", () => {
    render(<RechartsMiniBarChart data={sampleData} color="#4f6fff" />);

    const bar = screen.getByTestId("bar");
    expect(bar).toHaveAttribute("data-fill", "#4f6fff");
  });

  // ── height prop ───────────────────────────────────────────────────────

  it("renders with default height of 3rem", () => {
    const { container } = render(<RechartsMiniBarChart data={sampleData} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe("3rem");
  });

  it("renders with custom height", () => {
    const { container } = render(
      <RechartsMiniBarChart data={sampleData} height="6rem" />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe("6rem");
  });

  // ── ariaLabel prop ────────────────────────────────────────────────────

  it("uses default aria label", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const wrapper = screen.getByLabelText("Mini bar chart");
    expect(wrapper).toBeInTheDocument();
  });

  it("uses custom aria label", () => {
    render(
      <RechartsMiniBarChart
        data={sampleData}
        ariaLabel="Revenue mini chart"
      />
    );

    const wrapper = screen.getByLabelText("Revenue mini chart");
    expect(wrapper).toBeInTheDocument();
  });

  it("sets role='img' on the wrapper", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const wrapper = screen.getByLabelText("Mini bar chart");
    expect(wrapper).toHaveAttribute("role", "img");
  });

  // ── Chart data transformation ─────────────────────────────────────────

  it("transforms data with index-based name for XAxis", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const chart = screen.getByTestId("bar-chart");
    const parsed = JSON.parse(chart.getAttribute("data-data") || "[]");
    expect(parsed).toEqual([
      { value: 40, name: "0" },
      { value: 70, name: "1" },
      { value: 45, name: "2" },
    ]);
  });

  it("passes zero margins to BarChart", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const chart = screen.getByTestId("bar-chart");
    const margin = JSON.parse(chart.getAttribute("data-margin") || "{}");
    expect(margin).toEqual({ top: 0, right: 0, left: 0, bottom: 0 });
  });

  // ── Bar props ─────────────────────────────────────────────────────────

  it("bars use dataKey='value'", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const bar = screen.getByTestId("bar");
    expect(bar).toHaveAttribute("data-key", "value");
  });

  it("bars have correct radius [4, 4, 0, 0]", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const bar = screen.getByTestId("bar");
    const radius = JSON.parse(bar.getAttribute("data-radius") || "[]");
    expect(radius).toEqual([4, 4, 0, 0]);
  });

  // ── XAxis props ───────────────────────────────────────────────────────

  it("XAxis uses dataKey='name' and is hidden", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const xAxis = screen.getByTestId("x-axis");
    expect(xAxis).toHaveAttribute("data-key", "name");
    expect(xAxis).toHaveAttribute("data-hide", "true");
  });

  // ── Tooltip props ─────────────────────────────────────────────────────

  it("tooltip uses cursor={false}", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveAttribute("data-cursor", "false");
  });

  it("tooltip contentStyle references theme CSS variables", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const tooltip = screen.getByTestId("tooltip");
    const style = JSON.parse(
      tooltip.getAttribute("data-contentstyle") || "{}"
    );

    expect(style.background).toBe("var(--chart-tooltip-bg)");
    expect(style.color).toBe("var(--chart-tooltip-text)");
    expect(style.border).toBe("1px solid var(--chart-tooltip-border)");
    expect(style.borderRadius).toBe("6px");
    expect(style.fontSize).toBe("12px");
    expect(style.padding).toBe("4px 8px");
  });

  it("tooltip formatter displays percentage", () => {
    render(<RechartsMiniBarChart data={sampleData} />);

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveAttribute("data-formatter-result", "42%");
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  it("handles single data point", () => {
    render(<RechartsMiniBarChart data={[{ value: 100 }]} />);

    const chart = screen.getByTestId("bar-chart");
    const parsed = JSON.parse(chart.getAttribute("data-data") || "[]");
    expect(parsed).toEqual([{ value: 100, name: "0" }]);
  });

  it("handles zero values", () => {
    render(<RechartsMiniBarChart data={[{ value: 0 }]} />);

    const chart = screen.getByTestId("bar-chart");
    const parsed = JSON.parse(chart.getAttribute("data-data") || "[]");
    expect(parsed).toEqual([{ value: 0, name: "0" }]);
  });

  it("does not render chart content when data is empty", () => {
    render(<RechartsMiniBarChart data={[]} />);

    expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tooltip")).not.toBeInTheDocument();
  });

  it("renders aria-label on empty state", () => {
    render(<RechartsMiniBarChart data={[]} />);

    const wrapper = screen.getByLabelText("Mini bar chart");
    expect(wrapper).toBeInTheDocument();
  });
});
