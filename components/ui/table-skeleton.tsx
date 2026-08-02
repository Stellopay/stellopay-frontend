import { SkeletonAvatar, SkeletonLine } from "./skeleton";
import { cn } from "@/utils/commonUtils";

interface TableSkeletonProps {
  /** Number of grid columns per row. Defaults to `6`. */
  columns?: number;
  /** Number of skeleton body rows. Defaults to `6` for backward compatibility. */
  rows?: number;
  /** Whether to render the header row. Defaults to `true`. */
  showHeader?: boolean;
  className?: string;
}

/**
 * TableSkeleton - generic table-shaped loading placeholder.
 *
 * Renders an optional header row followed by `rows` skeleton body rows, each
 * split into `columns` cells. Pass a context-appropriate `rows` value so the
 * placeholder matches the real loaded content (e.g. a paginated transactions
 * table vs. a short notifications list).
 *
 * @example
 * ```tsx
 * <TableSkeleton columns={4} rows={8} />
 * ```
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

/**
 * TransactionTableSkeleton - transaction-specific table loading placeholder.
 *
 * Uses the transaction column layout (asset, counterparty, amount, token,
 * date, status) and renders `rows` skeleton body rows. Defaults to `6` rows.
 *
 * @example
 * ```tsx
 * <TransactionTableSkeleton rows={TRANSACTIONS_PAGE_SIZE} />
 * ```
 */
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
