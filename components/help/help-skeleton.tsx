"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading state for FAQ card
 */
export function FaqCardSkeleton() {
  return (
    <div className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl p-4 sm:p-5 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" shade="light" />
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for the FAQ grid
 */
export function FaqGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <FaqCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loading state for the Support tabs
 */
export function SupportTabsSkeleton() {
  return (
    <div className="flex gap-2 mb-4">
      <Skeleton className="h-10 w-28 rounded-lg" />
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>
  );
}

/**
 * Complete Help/Support page skeleton
 */
export function HelpPageSkeleton() {
  return (
    <div className="w-full bg-[#0D0D0D80] border border-[#2D2D2D] p-4 rounded-[0.875rem] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* FAQ Cards Grid */}
      <FaqGridSkeleton count={6} />
    </div>
  );
}

/**
 * Skeleton for support ticket list
 */
export function SupportTicketSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="p-4 border border-[#2D2D2D] rounded-lg flex items-center justify-between"
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" shade="light" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export default HelpPageSkeleton;
