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

export const CustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background text-foreground p-2 rounded shadow text-sm border border-border text-center">
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
export default function AnalyticsChart({
  data,
  showNotifications = false,
}: AnalyticsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={showNotifications ? "currentColor" : "#1f1b2e"}
          className={
            showNotifications ? "text-border dark:text-muted" : ""
          }
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
