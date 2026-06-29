"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import Skeleton from "@/components/ui/skeleton";
import type { AnalyticsViewsProps } from "./analytics-view";

const AnalyticsViews = dynamic(() => import("./analytics-view"), {
  ssr: false,
});

/**
 * ClientAnalyticsView wrapper that dynamically loads the heavy recharts-based
 * AnalyticsViews component on the client-side with an accessible skeleton loader.
 * Ensures the main bundle does not include large charting libraries on first paint.
 *
 * Handles both the standalone page layout and the dashboard layout layout dynamically.
 */
export default function ClientAnalyticsView(props: AnalyticsViewsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || props.isLoading) {
    if (props.showNotifications) {
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

  return <AnalyticsViews {...props} />;
}

