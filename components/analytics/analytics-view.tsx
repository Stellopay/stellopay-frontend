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
  { month: "Jan", agreements: 0 },
  { month: "Feb", agreements: 0 },
  { month: "Mar", agreements: 0 },
  { month: "Apr", agreements: 0 },
  { month: "May", agreements: 0 },
  { month: "Jun", agreements: 0 },
  { month: "Jul", agreements: 0 },
  { month: "Aug", agreements: 0 },
  { month: "Sept", agreements: 0 },
  { month: "Oct", agreements: 0 },
  { month: "Nov", agreements: 0 },
  { month: "Dec", agreements: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = Math.max(0, payload[0].value || 0);
    return (
      <div className="bg-white text-black p-2 rounded shadow text-sm">
        <p className="font-semibold">{label}</p>
        <p>{value.toLocaleString()} agreements</p>
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
  const [totalAgreements, setTotalAgreements] = useState(0);
  const [agreementDefault, setAgreementDefault] = useState<string>("");

  useEffect(() => {
    void apiGet<{ address: string }>("/agreement/defaults")
      .then((d) => setAgreementDefault(d.address))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!address || !agreementDefault) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch agreements list
        const agreementsResult = await apiGet<{ agreements: Array<{ agreement_id: string; status: number }> }>(
          `/agreement/${agreementDefault}/list/${address}?refresh=true`
        );
        
        const agreements = agreementsResult.agreements || [];
        setTotalAgreements(agreements.length);
        
        // Group agreements by month created (simplified - using current month distribution)
        // In a real scenario, you'd parse transaction dates to get creation dates
        const monthData = defaultData.map((item, index) => {
          // For now, distribute agreements evenly across months as a placeholder
          // This should be replaced with actual date-based grouping
          const monthAgreements = Math.floor(agreements.length / 12);
          return {
            ...item,
            agreements: monthAgreements
          };
        });
        
        setData(monthData);
      } catch (e) {
        console.error("[analytics] Failed to fetch analytics:", e);
        setData(defaultData);
        setTotalAgreements(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [address, year, agreementDefault]);

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
          <div>
            <h2 className="font-semibold text-lg">Agreements Created</h2>
            <p className="text-sm text-[#A0A0A0]">Total: {totalAgreements} agreements</p>
          </div>
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
              dataKey="agreements"
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
