"use client";

import dynamic from "next/dynamic";

import Skeleton from "@/components/ui/skeleton";

const AnalyticsViews = dynamic(() => import("./analytics-view"), {
  ssr: false,
  loading: () => (
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
  ),
});

interface ClientAnalyticsViewProps {
  isLoading?: boolean;
}

/**
 * ClientAnalyticsView wrapper that dynamically loads the heavy recharts-based
 * AnalyticsViews component on the client-side with an accessible skeleton loader.
 * Ensures the main bundle does not include large charting libraries on first paint.
 */
export default function ClientAnalyticsView({ isLoading = false }: ClientAnalyticsViewProps) {
  return <AnalyticsViews isLoading={isLoading} />;
}
