import Skeleton from "@/components/ui/skeleton";
import { AccountSummaryCardSkeleton } from "@/components/ui/card-skeleton";

/**
 * Route-level loading UI for the `/dashboard` segment.
 *
 * Next.js wraps `app/dashboard/page.tsx` in a Suspense boundary and renders
 * this component as the fallback while the route segment streams in. It mirrors
 * the real dashboard layout — welcome header, three account summary cards,
 * six quick-action tiles, and the four-up analytics KPI grid — so the visible
 * structure stays stable and Cumulative Layout Shift (CLS) is minimized when
 * the actual content mounts.
 *
 * @remarks
 * Security: this fallback renders only empty skeleton shapes. It never reads,
 * fetches, or displays real account data or PII — there is nothing sensitive to
 * leak in a transient loading state.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="w-full min-h-screen bg-white dark:bg-[#0D0D0D]"
    >
      <span className="sr-only">Loading dashboard</span>

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-10">
        {/* Welcome / Account Overview header */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-72 md:h-12 md:w-96" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>

        {/* Account summary cards — matches grid-cols-1 md:grid-cols-2 lg:grid-cols-3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AccountSummaryCardSkeleton />
          <AccountSummaryCardSkeleton />
          <AccountSummaryCardSkeleton />
        </div>

        {/* Quick actions — matches grid up to xl:grid-cols-6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>

        {/* Analytics insights — mirrors the dynamic-import fallback shape */}
        <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-[#111111] space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
