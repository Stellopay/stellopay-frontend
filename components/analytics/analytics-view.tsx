"use client";

import React from "react";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import chart from "@/public/chart-up.png";
import { formatChartValue } from "@/utils/formatUtils";
import { Skeleton } from "@/components/ui/skeleton";

const data = [
  { month: "Jan", views: 24000 },
  { month: "Feb", views: 92000 },
  { month: "Mar", views: 48000 },
  { month: "Apr", views: 12000 },
  { month: "May", views: 24000 },
  { month: "Jun", views: 36000 },
  { month: "Jul", views: 30000 },
  { month: "Aug", views: 48000 },
  { month: "Sept", views: 60000 },
  { month: "Oct", views: 18000 },
  { month: "Nov", views: 42000 },
  { month: "Dec", views: 54000 },
];

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-black p-2 rounded shadow text-sm">
        <p className="font-semibold">{label}</p>
        <p>{payload[0].value.toLocaleString()} views</p>
      </div>
    );
  }
  return null;
};

interface AnalyticsViewsProps {
  isLoading?: boolean;
}

const AnalyticsViews = ({ isLoading = false }: AnalyticsViewsProps) => {
  if (isLoading) {
    return (
      <div className="bg-[#0D0D0D80] text-white rounded-xl border border-[#2D2D2D] p-4 w-full h-full flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        <div className="w-full h-full aspect-[3/1] rounded-lg border border-[#2D2D2D] p-2 sm:p-4">
          <div className="h-full flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0D0D80] text-white rounded-xl border border-[#2D2D2D] p-4 w-full h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#121212] border border-[#2E2E2E] p-2 rounded-lg">
            <Image
              src={chart}
              alt="Analytics Chart Icon"
              width={24}
              height={24}
            />
          </div>
          <h2 className="font-semibold text-lg">Analytics views</h2>
        </div>
        <button className="px-3 py-1 text-sm rounded-lg border border-[#2D2D2D] bg-transparent">
          This Year
        </button>
      </div>

      <div className="w-full h-full aspect-[3/1] rounded-lg border border-[#2D2D2D] p-2 sm:p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#1f1b2e"
            />
            <XAxis dataKey="month" tick={{ fill: "#aaa", fontSize: 10 }} />
            <YAxis
              tick={{ fill: "#aaa", fontSize: 10 }}
              tickFormatter={formatChartValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="views"
              fill="#2E2E2E"
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsViews;
