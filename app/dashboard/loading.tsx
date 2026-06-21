import { AccountSummaryCardSkeleton, CardSkeleton } from "@/components/ui/card-skeleton";

export default function DashboardLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
      className="min-h-screen p-4 text-white sm:p-6"
    >
      <span className="sr-only">Loading dashboard...</span>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#2D2D2D] bg-[#0D0D0D80] p-4">
          <div className="mb-4 flex items-center gap-3">
            <CardSkeleton showHeader={false} lines={1} className="w-48 border-0 p-0" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <AccountSummaryCardSkeleton />
            <AccountSummaryCardSkeleton />
            <AccountSummaryCardSkeleton />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <CardSkeleton lines={6} className="min-h-[22rem] bg-[#0D0D0D80]" />
          <CardSkeleton lines={4} className="min-h-[22rem] bg-[#0D0D0D80]" />
        </div>
      </div>
    </main>
  );
}
