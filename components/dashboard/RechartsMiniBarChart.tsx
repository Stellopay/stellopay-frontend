import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

/**
 * Props for the RechartsMiniBarChart component.
 */
export interface RechartsMiniBarChartProps {
  /**
   * Array of data points for the bar chart. Each point must contain a numeric `value`.
   */
  data: { value: number }[];
  /**
   * The fill color for the bars — pass a CSS `<color>` value or a `var(…)` reference
   * to a theme token (e.g. `"var(--chart-blue)"`) so the chart adapts to dark mode.
   */
  color: string;
  /**
   * Optional height of the chart container (e.g. '3rem'). Defaults to '3rem'.
   */
  height?: string;
  /**
   * Accessible label describing the chart for assistive technologies.
   */
  ariaLabel?: string;
}

/**
 * A lightweight, responsive mini bar chart using Recharts.
 *
 * Bar and tooltip colours are driven by CSS custom properties defined in
 * `globals.css` (`--chart-blue`, `--chart-green`, `--chart-amber`,
 * `--chart-tooltip-bg`) so they automatically switch between light and dark
 * values when the `.dark` class is toggled on `<html>`.
 */
export const RechartsMiniBarChart: React.FC<RechartsMiniBarChartProps> = ({
  data,
  color,
  height = "3rem",
  ariaLabel = "Mini bar chart",
}) => {
  const transformedData = data.map((d, i) => ({ ...d, name: i.toString() }));

  return (
    <div
      className="flex items-end"
      style={{ height }}
      aria-label={ariaLabel}
      role="img"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="name" hide />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border, #e4e4e7)",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              fontSize: "12px",
            }}
            formatter={(value) =>
              typeof value === "number" ? `${value}%` : `${value ?? ""}`
            }
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
