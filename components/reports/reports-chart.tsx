"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import type { PeriodBucket } from "@/utils/reportUtils";

interface ReportsChartProps {
  data: PeriodBucket[];
  /** Which metric to chart: "in" (totalIn), "out" (totalOut), or "net" (netFlow). */
  metric?: "in" | "out" | "net";
}

/**
 * Recharts-based bar chart for the Reports page.
 *
 * Loaded via `next/dynamic` with `ssr: false` so the large Recharts library
 * is not included in the initial route chunk.
 */
export default function ReportsChart({ data, metric = "net" }: ReportsChartProps) {
  const chartData = data.map((b) => ({
    label: b.label,
    value:
      metric === "in" ? b.totalIn : metric === "out" ? b.totalOut : b.netFlow,
  }));

  const colorVar =
    metric === "in"
      ? "var(--chart-2)"
      : metric === "out"
        ? "var(--chart-5)"
        : "var(--chart-1)";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-tooltip-border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--chart-tooltip-text)" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--chart-tooltip-text)" }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--chart-tooltip-bg)",
            border: "1px solid var(--chart-tooltip-border)",
            borderRadius: "8px",
            color: "var(--chart-tooltip-text)",
          }}
          formatter={(value: number) => `$${value.toFixed(2)}`}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.value >= 0 ? colorVar : "var(--chart-5)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
