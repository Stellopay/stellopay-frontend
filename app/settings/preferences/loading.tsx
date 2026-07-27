import Skeleton from "@/components/ui/skeleton";
import {
  CardSkeleton,
  AccountSummaryCardSkeleton,
} from "@/components/ui/card-skeleton";

/**
 * Route-level loading UI for the `/settings/preferences` segment.
 *
 * Serves as the Suspense fallback for `app/settings/preferences/page.tsx` (an
 * async server component that awaits `searchParams`) while it streams in. It
 * mirrors the settings shell: the four-up summary card row and the
 * account-section grid (a form-shaped card plus a sidebar), so the form layout
 * holds its place and CLS is minimized once the interactive content mounts.
 *
 * @remarks
 * Security: only empty skeleton shapes are rendered. No profile fields, email,
 * wallet data, or any other PII are read or displayed in this transient state.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-8 px-4 py-8 md:px-6"
    >
      <span className="sr-only">Loading preferences</span>

      {/* Settings header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Summary cards — matches grid gap-4 md:grid-cols-2 xl:grid-cols-4 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AccountSummaryCardSkeleton />
        <AccountSummaryCardSkeleton />
        <AccountSummaryCardSkeleton />
        <AccountSummaryCardSkeleton />
      </div>

      {/* Account section — form card + sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Main form card: header + paired form fields */}
        <div className="rounded-xl border border-[#2D2D2D] p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>

          {/* Six form fields in a two-column layout (label + input) */}
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>

        {/* Sidebar: section map + danger zone */}
        <div className="space-y-6">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
        </div>
      </div>
    </div>
  );
}
