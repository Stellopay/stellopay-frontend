import { Skeleton } from "./skeleton";
import { cn } from "@/utils/commonUtils";
import { TRANSACTIONS_PAGE_SIZE } from "@/lib/transactionDefaults";

interface TableSkeletonProps {
  /**
   * Number of columns in the table
   */
  columns?: number;
  /**
   * Number of rows to display
   */
  rows?: number;
  /**
   * Show table header
   */
  showHeader?: boolean;
  /**
   * Additional class names for the container
   */
  className?: string;
}

/**
 * Table skeleton component for loading table layouts
 */
export function TableSkeleton({
  columns = 6,
  rows = 6,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {showHeader && (
        <div
          className="grid gap-4 py-3 px-4 border-b border-[#2D2D2D]"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 w-20" />
          ))}
        </div>
      )}
      <div className="divide-y divide-[#2D2D2D]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4 py-3 px-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className={cn(
                  "h-4",
                  colIndex === 0
                    ? "w-24"
                    : colIndex === columns - 1
                      ? "w-16"
                      : "w-full",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Transaction Table Skeleton - matches the design of transaction history table
 */
export function TransactionTableSkeleton({
  rows = TRANSACTIONS_PAGE_SIZE,
}: {
  rows?: number;
}) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr_1fr_0.8fr] gap-4 py-3 px-4 border-b border-[#2D2D2D]">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-[#2D2D2D]">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`row-${index}`}
            className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr_1fr_0.8fr] gap-4 py-3 px-4 items-center"
          >
            {/* Transaction Type/ID */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Address */}
            <Skeleton className="h-4 w-32" />
            {/* Date */}
            <Skeleton className="h-4 w-24" />
            {/* Token */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            {/* Amount */}
            <Skeleton className="h-4 w-20" />
            {/* Status */}
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
