"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading state for the pagination component
 */
export function PaginationSkeleton() {
  return (
    <section className="flex items-center justify-center gap-3 py-2 my-4 px-2">
      {/* Text showing item range */}
      <div className="hidden md:block">
        <Skeleton className="h-4 w-40" />
      </div>
      {/* Pagination buttons */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </section>
  );
}

export default PaginationSkeleton;
