"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading state for the standalone Analytics Chart component
 * Used in the analytics-view page
 */
export function AnalyticsChartSkeleton() {
  return (
    <div className="bg-[#0D0D0D80] text-white rounded-xl border border-[#2D2D2D] p-4 w-full h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>

      {/* Chart Area */}
      <div className="w-full h-full aspect-[3/1] rounded-lg border border-[#2D2D2D] p-2 sm:p-4">
        <div className="w-full h-full flex">
          {/* Y-axis */}
          <div className="flex flex-col justify-between py-4 pr-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>

          {/* Chart bars */}
          <div className="flex-1 flex items-end justify-around gap-2 pb-8">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-end h-full"
              >
                <Skeleton
                  className="w-7 rounded-t-md"
                  style={{
                    height: `${Math.random() * 60 + 30}%`,
                  }}
                />
                <Skeleton className="h-3 w-6 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsChartSkeleton;
