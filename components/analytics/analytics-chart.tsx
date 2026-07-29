"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatChartValue } from "@/utils/formatUtils";
import type { AnalyticsDataPoint } from "./analytics-view";

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2 rounded shadow text-sm border border-zinc-200 dark:border-zinc-800 text-center">
        <p className="font-semibold">{label}</p>
        <p>{payload[0].value.toLocaleString()} views</p>
      </div>
    );
  }
  return null;
};

interface AnalyticsChartProps {
  data: AnalyticsDataPoint[];
  showNotifications?: boolean;
}

/**
 * Encapsulates the recharts dependency so it can be dynamically imported
 * without shipping the large library in the initial chunk.
 */
export default function AnalyticsChart({ data, showNotifications = false }: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="analytics-chart-empty"
        className="flex flex-col items-center justify-center w-full h-full min-h-[180px] p-6 text-center"
      >
        <div className="text-zinc-400 dark:text-zinc-500 mb-3">
          <BarChart3 className="w-10 h-10 stroke-[1.5]" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          No analytics data available
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
          There are no data points to display for the selected period.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={showNotifications ? "currentColor" : "#1f1b2e"}
          className={showNotifications ? "text-zinc-200 dark:text-zinc-800" : ""}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: "#aaa", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "#aaa", fontSize: 10 }}
          tickFormatter={formatChartValue}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="views"
          fill={showNotifications ? "#3b82f6" : "#2E2E2E"}
          radius={[4, 4, 0, 0]}
          barSize={showNotifications ? 20 : 28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
