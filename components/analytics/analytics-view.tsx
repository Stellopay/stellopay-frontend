"use client";

import React, { useEffect, useState } from "react";
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
import { apiGet } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";

const defaultData = [
  { month: "Jan", views: 0 },
  { month: "Feb", views: 0 },
  { month: "Mar", views: 0 },
  { month: "Apr", views: 0 },
  { month: "May", views: 0 },
  { month: "Jun", views: 0 },
  { month: "Jul", views: 0 },
  { month: "Aug", views: 0 },
  { month: "Sept", views: 0 },
  { month: "Oct", views: 0 },
  { month: "Nov", views: 0 },
  { month: "Dec", views: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = Math.max(0, payload[0].value || 0);
    return (
      <div className="bg-white text-black p-2 rounded shadow text-sm">
        <p className="font-semibold">{label}</p>
        <p>{value.toLocaleString()} views</p>
      </div>
    );
  }
  return null;
};

const AnalyticsViews = () => {
  const { address } = useWallet();
  const [data, setData] = useState(defaultData);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const result = await apiGet<{ year: number; data: Array<{ month: string; views: number }> }>(
          `/analytics/${address}?year=${year}`
        );
        console.log("[analytics] Fetched analytics data:", result.data?.length || 0, "months with data");
        
        // Normalize data: ensure views are never negative (clamp to 0)
        const normalizedData = (result.data || defaultData).map(item => ({
          ...item,
          views: Math.max(0, item.views || 0)
        }));
        
        setData(normalizedData);
      } catch (e) {
        console.error("[analytics] Failed to fetch analytics:", e);
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [address, year]);

  return (
    <div className="bg-[#0D0D0D80] text-white rounded-xl border border-[#2D2D2D] p-4 w-full h-[400px] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2 flex-shrink-0">
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
        <button 
          className="px-3 py-1 text-sm rounded-lg border border-[#2D2D2D] bg-transparent"
          onClick={() => setYear(new Date().getFullYear())}
        >
          This Year
        </button>
      </div>

      <div className="w-full flex-1 min-h-0 rounded-lg border border-[#2D2D2D] p-2 sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#A0A0A0]">Loading analytics...</div>
        ) : (
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
              domain={[0, 'auto']}
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
        )}
      </div>
    </div>
  );
};

export default AnalyticsViews;
