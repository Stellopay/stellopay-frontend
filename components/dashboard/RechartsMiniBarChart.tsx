"use client";

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
design-system/mini-bar-chart-dark-tokens
   * CSS custom property name to use for the bar fill color (e.g. `"--chart-1"`).
   * The property is referenced as `var(<cssVar>)` so it reacts to theme changes
   * without a page reload.
   *
   * Accepts any valid CSS variable name starting with `--`. For a static color
   * pass a hex/rgb string via the `color` prop instead.
   */
  cssVar?: string;
  /**
   * Static color value for the bar fill (e.g. `"#3b82f6"` or `"rgb(59,130,246)"`).
   * Ignored when `cssVar` is set. Use `cssVar` for theme‑aware charts.

   * The fill color for the bars — pass a CSS `<color>` value or a `var(…)` reference
   * to a theme token (e.g. `"var(--chart-blue)"`) so the chart adapts to dark mode.
 main
   */
  color?: string;
  /**
 design-system/mini-bar-chart-dark-tokens
   * Optional height of the chart container (e.g. `"3rem"`). Defaults to `"3rem"`.

   * Optional height of the chart container (e.g. '3rem'). Defaults to '3rem'.
 main
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
 design-system/mini-bar-chart-dark-tokens
 * Bar fill is driven by a CSS custom property so the chart adapts to theme
 * changes (light/dark) without a page reload. Tooltip background, text, and
 * border also use CSS variables defined in `app/globals.css` for consistent
 * contrast across themes.
 *
 * Usage — theme‑aware:
 * ```tsx
 * <RechartsMiniBarChart data={data} cssVar="--chart-1" />
 * ```
 *
 * Usage — static color:
 * ```tsx
 * <RechartsMiniBarChart data={data} color="#4f6fff" />
 * ```

 * Bar and tooltip colours are driven by CSS custom properties defined in
 * `globals.css` (`--chart-blue`, `--chart-green`, `--chart-amber`,
 * `--chart-tooltip-bg`) so they automatically switch between light and dark
 * values when the `.dark` class is toggled on `<html>`.
 main
 */
export const RechartsMiniBarChart: React.FC<RechartsMiniBarChartProps> = ({
  data,
  cssVar,
  color,
  height = "3rem",
  ariaLabel = "Mini bar chart",
}) => {
  const transformedData = data.map((d, i) => ({ ...d, name: i.toString() }));

  // Resolve fill value: prefer cssVar, fall back to color, fall back to --chart-1
  const fill = cssVar
    ? `var(${cssVar})`
    : color ?? "var(--chart-1)";

  const hasData = data.length > 0;

  return (
    <div
      className="flex items-end"
      style={{ height }}
      aria-label={ariaLabel}
      role="img"
    >
      {hasData ? (
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
                color: "var(--chart-tooltip-text)",
                border: "1px solid var(--chart-tooltip-border)",
                borderRadius: "6px",
                fontSize: "12px",
                padding: "4px 8px",
              }}
              formatter={(value: number) => `${value}%`}
            />
            <Bar dataKey="value" fill={fill} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div
          className="flex items-center justify-center w-full h-full text-xs text-muted-foreground"
          aria-label="No chart data available"
        >
 design-system/mini-bar-chart-dark-tokens
          No data
        </div>
      )}

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
 main
    </div>
  );
};
