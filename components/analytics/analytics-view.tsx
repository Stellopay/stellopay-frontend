"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

import chart from "@/public/chart-up.png";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentHistory from "@/components/dashboard/payment-history";

const CardSkeleton = () => (
  <div className="w-full h-full flex items-end gap-2" aria-busy="true" aria-live="polite" role="status">
    <span className="sr-only">Loading chart...</span>
    {Array.from({ length: 12 }).map((_, i) => (
      <Skeleton
        key={i}
        className="flex-1"
        shade="dark"
        style={{ height: `${20 + (i % 4) * 15}%` }}
      />
    ))}
  </div>
);

const AnalyticsChart = dynamic(() => import("./analytics-chart"), {
  ssr: false,
  loading: () => <CardSkeleton />,
});
/**
 * Data structure for an individual analytics data point.
 */
export interface AnalyticsDataPoint {
  month: string;
  views: number;
}

/**
 * Props accepted by the canonical AnalyticsViews component.
 */
export interface AnalyticsViewsProps {
  /**
   * Whether the component is in a loading state. Renders skeletons if true.
   * @default false
   */
  isLoading?: boolean;
  /**
   * The list of monthly views data points.
   */
  data?: AnalyticsDataPoint[];
  /**
   * Whether to display the notifications panel with payment history on the right.
   * @default false
   */
  showNotifications?: boolean;
  /**
   * Whether to display the interactive year selector dropdown.
   * @default false
   */
  showDropdown?: boolean;
}

const defaultData: AnalyticsDataPoint[] = [
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

/**
 * The canonical AnalyticsViews component.
 * Renders a recharts bar chart with a clean, responsive design, an optional year-selector dropdown,
 * and an optional notifications sidebar containing payment history.
 *
 * @param props - Configuration properties for the component.
 * @returns The rendered JSX element.
 */
const AnalyticsViews = ({
  isLoading = false,
  data,
  showNotifications = false,
  showDropdown = false,
}: AnalyticsViewsProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("This Year");

  const yearOptions = ["This Year", "2024", "2023", "2022", "2021", "2020"];

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setIsDropdownOpen(false);
  };

  const chartData = data || defaultData;

  if (isLoading) {
    if (showNotifications) {
      return (
        <div className="max-w-full min-h-[332px] flex flex-col md:flex-row gap-6" aria-busy="true" aria-live="polite" role="status">
          <span className="sr-only">Loading analytics...</span>
          <div className="w-full md:w-2/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#111111] transition-colors flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-lg" shade="dark" />
                <Skeleton className="h-6 w-32" shade="dark" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" shade="dark" />
            </div>
            <div className="w-full h-56 rounded-lg border border-zinc-100 dark:border-zinc-800/50 p-2 sm:p-4">
              <div className="h-full flex items-end gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="flex-1"
                    shade="dark"
                    style={{ height: `${20 + (i % 4) * 15}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#111111] flex flex-col gap-6 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" shade="dark" />
                <Skeleton className="h-6 w-24" shade="dark" />
              </div>
              <Skeleton className="h-10 w-20 rounded-xl" shade="dark" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-20 rounded-xl" shade="dark" />
              <Skeleton className="h-20 rounded-xl" shade="dark" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#0D0D0D80] text-white rounded-xl border border-[#2D2D2D] p-4 w-full h-full flex flex-col justify-between" aria-busy="true" aria-live="polite" role="status">
        <span className="sr-only">Loading analytics views chart...</span>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-lg" shade="dark" />
            <Skeleton className="h-6 w-32" shade="dark" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" shade="dark" />
        </div>

        <div className="w-full h-full aspect-[3/1] rounded-lg border border-[#2D2D2D] p-2 sm:p-4">
          <div className="h-full flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                shade="dark"
                style={{ height: `${20 + (i % 4) * 15}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={showNotifications ? "max-w-full min-h-[332px] flex flex-col md:flex-row gap-6" : "w-full h-full"}>
      <div className={showNotifications ? "w-full md:w-2/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#111111] transition-colors" : "bg-[#0D0D0D80] text-white rounded-xl border border-[#2D2D2D] p-4 w-full h-full flex flex-col justify-between"}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div className={showNotifications ? "w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex justify-center items-center" : "bg-[#121212] border border-[#2E2E2E] p-2 rounded-lg"}>
              <Image
                src={chart}
                alt="Analytics Chart Icon"
                width={showNotifications ? 20 : 24}
                height={showNotifications ? 20 : 24}
                className={showNotifications ? "object-contain w-5 h-5 dark:invert-[0.9]" : ""}
              />
            </div>
            <h2 className={showNotifications ? "text-xl font-bold text-zinc-900 dark:text-white" : "font-semibold text-lg"}>
              Analytics views
            </h2>
          </div>

          {showDropdown ? (
            <div className="relative">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-10 px-4 flex items-center gap-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
              >
                <span className="font-medium">{selectedYear}</span>
                {isDropdownOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </div>

              {isDropdownOpen && (
                <div className="absolute top-12 right-0 w-32 bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-10 overflow-hidden">
                  {yearOptions.map((year, index) => (
                    <div
                      key={index}
                      onClick={() => handleYearSelect(year)}
                      className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button className={showNotifications ? "h-10 px-4 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 font-medium bg-transparent" : "px-3 py-1 text-sm rounded-lg border border-[#2D2D2D] bg-transparent"}>
              This Year
            </button>
          )}
        </div>

        <div className={showNotifications ? "w-full h-56 mt-4 border border-zinc-100 dark:border-zinc-800/50 p-6 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/20" : "w-full h-full aspect-[3/1] rounded-lg border border-[#2D2D2D] p-2 sm:p-4"}>
          <AnalyticsChart data={chartData} showNotifications={showNotifications} />
        </div>
      </div>

      {showNotifications && (
        <div className="w-full md:w-1/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#111111] flex flex-col gap-6 transition-colors">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
                <Image
                  src="/notification-02.png"
                  alt="Notification"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain dark:invert-[0.9]"
                />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Notifications
              </h2>
            </div>

            <div className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">View All</span>
              <ChevronRight className="text-zinc-400" />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <PaymentHistory />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsViews;

