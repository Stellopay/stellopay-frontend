import { Skeleton } from "./skeleton";
import { cn } from "@/utils/commonUtils";

interface CardSkeletonProps {
  /**
   * Show header skeleton (icon + title)
   */
  showHeader?: boolean;
  /**
   * Number of content lines to show
   */
  lines?: number;
  /**
   * Additional class names for the container
   */
  className?: string;
}

/**
 * Card skeleton component for loading card layouts
 */
export function CardSkeleton({
  showHeader = true,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn("p-4 rounded-xl border border-[#2D2D2D]", className)}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Account Summary Card Skeleton - matches the design of account summary cards
 */
export function AccountSummaryCardSkeleton() {
  return (
    <div className="w-full h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl">
      <div className="w-full flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="w-5 h-5 rounded" />
      </div>
      <Skeleton className="h-8 w-40 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
