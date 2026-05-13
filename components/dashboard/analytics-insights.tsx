"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Activity,
  Wallet,
  ChevronDown,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/commonUtils";

export interface KPICardItem {
  icon: LucideIcon;
  value: string;
  label: string;
  change: string;
  iconColor: string;
  iconBg: string;
}

const timeRangeOptions = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];

const defaultKPIs: KPICardItem[] = [
  {
    icon: TrendingUp,
    value: "$847.5K",
    label: "Total Volume",
    change: "+12.5%",
    iconColor: "text-[#2563EB] dark:text-[#60A5FA]",
    iconBg: "bg-[#EFF6FF] dark:bg-[#1E3A5F]",
  },
  {
    icon: DollarSign,
    value: "$3,245",
    label: "Avg. Transaction",
    change: "+8.2%",
    iconColor: "text-[#16A34A] dark:text-[#4ADE80]",
    iconBg: "bg-[#F0FDF4] dark:bg-[#14532D]",
  },
  {
    icon: Activity,
    value: "99.2%",
    label: "Success Rate",
    change: "+0.3%",
    iconColor: "text-[#7C3AED] dark:text-[#A78BFA]",
    iconBg: "bg-[#F5F3FF] dark:bg-[#3B2864]",
  },
  {
    icon: Wallet,
    value: "156",
    label: "Active Wallets",
    change: "+24",
    iconColor: "text-[#EA580C] dark:text-[#FB923C]",
    iconBg: "bg-[#FFF7ED] dark:bg-[#431407]",
  },
];

interface AnalyticsInsightsProps {
  kpis?: KPICardItem[];
  viewAllHref?: string;
}

export function AnalyticsInsights({
  kpis = defaultKPIs,
  viewAllHref = "/analytics-view",
}: AnalyticsInsightsProps) {
  const [timeRange, setTimeRange] = useState(timeRangeOptions[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <section
      className={cn(
        "rounded-2xl border p-6 transition-all",
        "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 shadow-sm"
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Analytics & Insights
          </h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Track your payment activity and performance
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors",
                "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800",
                "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select time range"
            >
              {timeRange}
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden="true"
                  onClick={() => setDropdownOpen(false)}
                />
                <ul
                  role="listbox"
                  className={cn(
                    "absolute top-full right-0 mt-2 min-w-[160px] py-1 rounded-xl border shadow-xl z-20 overflow-hidden",
                    "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  {timeRangeOptions.map((option) => (
                    <li
                      key={option}
                      role="option"
                      aria-selected={timeRange === option}
                      onClick={() => {
                        setTimeRange(option);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors",
                        "text-zinc-600 dark:text-zinc-400",
                        "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                        timeRange === option && "bg-zinc-50 dark:bg-zinc-900/50 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <Link href={viewAllHref}>
            <button className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={cn(
                "rounded-2xl border p-5 flex flex-col group hover:shadow-md transition-all",
                "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                    item.iconBg,
                    item.iconColor
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {item.change}
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-4 tracking-tight">
                {item.value}
              </p>
              <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
