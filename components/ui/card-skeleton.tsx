import {
  SkeletonAvatar,
  SkeletonCard,
  SkeletonLine,
} from "./skeleton";
import { cn } from "@/utils/commonUtils";

interface CardSkeletonProps {
  showHeader?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showHeader = true,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <SkeletonCard
      showHeader={showHeader}
      lines={lines}
      className={className}
    />
  );
}

export function AccountSummaryCardSkeleton() {
  return (
    <div className="h-[7.5rem] w-full rounded-xl border border-[#2E2E2E] px-6 py-4">
      <div className="mb-2 flex w-full items-center gap-2">
        <SkeletonLine width="w-32" />
        <SkeletonAvatar size={20} className="rounded" />
      </div>
      <SkeletonLine width="w-40" className="mb-1 h-8" />
      <SkeletonLine width="w-24" className="h-3" />
    </div>
  );
}
