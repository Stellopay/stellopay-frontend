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
