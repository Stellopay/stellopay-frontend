"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading state for the Analytics View component
 * Includes chart skeleton and notifications/payment history skeleton
 */
export function AnalyticsViewSkeleton() {
  return (
    <div className="max-w-full h-[332px] flex max-md:flex-col gap-6">
      {/* Chart Section Skeleton */}
      <div className="w-2/3 h-[20.75rem] border border-[#2D2D2D] rounded-md gap-4 p-4">
        {/* Header */}
        <div className="w-full h-9 flex justify-between mx-auto">
          <div className="flex align-middle items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>

        {/* Chart Area */}
        <div className="w-full h-[248px] mt-3.5 border border-[#2D2D2D] p-4 rounded-md">
          <div className="w-full h-[198px] mt-2 flex justify-between">
            {/* Y-axis labels */}
            <div className="w-[35.25px] h-[194px] flex flex-col gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>

            {/* Bar chart placeholders */}
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-[35.25px] h-[194px] flex flex-col justify-end items-center">
                  <Skeleton
                    className="w-8 rounded-sm mb-1"
                    style={{
                      height: `${Math.random() * 120 + 40}px`,
                    }}
                  />
                  <Skeleton className="h-3 w-6 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Section Skeleton */}
      <div className="w-1/3 h-[332px] border border-[#2D2D2D] rounded-md p-4">
        {/* Header */}
        <div className="w-full h-9 gap-3 flex justify-between">
          <div className="flex align-middle justify-center items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="w-[87px] h-9 rounded-lg" />
        </div>

        {/* Payment History Items */}
        <PaymentHistorySkeleton />
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for Payment History items
 */
export function PaymentHistorySkeleton() {
  return (
    <div className="max-w-full h-[15.5rem] gap-4 mt-3.5">
      <div className="flex flex-col gap-3.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-[4.5rem] gap-2.5 py-3 px-6 border border-[#2D2D2D] rounded-md flex items-center"
          >
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-48" shade="light" />
            </div>
            <Skeleton className="w-6 h-6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalyticsViewSkeleton;
