import { SkeletonAvatar, SkeletonLine } from "./skeleton";
import { cn } from "@/utils/commonUtils";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

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
          className="grid gap-4 px-4 py-3 border-b border-[#2D2D2D]"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonLine key={`header-${i}`} width="w-20" />
          ))}
        </div>
      )}
      <div className="divide-y divide-[#2D2D2D]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonLine
                key={`cell-${rowIndex}-${colIndex}`}
                width={
                  colIndex === 0
                    ? "w-24"
                    : colIndex === columns - 1
                      ? "w-16"
                      : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TransactionTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr_1fr_0.8fr] gap-4 px-4 py-3 border-b border-[#2D2D2D]">
        <SkeletonLine width="w-24" />
        <SkeletonLine width="w-20" />
        <SkeletonLine width="w-16" />
        <SkeletonLine width="w-16" />
        <SkeletonLine width="w-20" />
        <SkeletonLine width="w-16" />
      </div>
      <div className="divide-y divide-[#2D2D2D]">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`row-${index}`}
            className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr_1fr_0.8fr] items-center gap-4 px-4 py-3"
          >
            <div className="space-y-1">
              <SkeletonLine width="w-20" />
              <SkeletonLine width="w-16" className="h-3" />
            </div>
            <SkeletonLine width="w-32" />
            <SkeletonLine width="w-24" />
            <div className="flex items-center gap-2">
              <SkeletonAvatar size={24} />
              <SkeletonLine width="w-12" />
            </div>
            <SkeletonLine width="w-20" />
            <SkeletonLine width="w-16" className="h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
