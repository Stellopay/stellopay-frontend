"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface NotificationPanelSkeletonProps {
  /**
   * Number of notification items to show
   */
  itemCount?: number;
}

/**
 * Skeleton loading state for the Notification Panel component
 * Displays placeholder notification items with shimmer animation
 */
export function NotificationPanelSkeleton({
  itemCount = 3,
}: NotificationPanelSkeletonProps) {
  return (
    <div className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl p-4 text-[#E5E5E5]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Notification Items */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: itemCount }).map((_, index) => (
          <NotificationItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for a single notification item
 */
export function NotificationItemSkeleton() {
  return (
    <div className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-3 px-5 flex justify-between items-center">
      <div className="grid gap-2 flex-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-48" shade="light" />
      </div>
      <Skeleton className="w-6 h-6 rounded-sm" />
    </div>
  );
}

export default NotificationPanelSkeleton;
