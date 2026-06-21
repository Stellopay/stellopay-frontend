import { CardSkeleton } from "@/components/ui/card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPreferencesLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Loading settings preferences"
      className="min-h-screen p-4 text-white sm:p-6"
    >
      <span className="sr-only">Loading settings preferences...</span>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} lines={2} className="min-h-28 bg-white/5" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <CardSkeleton lines={8} className="min-h-[32rem] bg-white/5" />
          <CardSkeleton lines={6} className="min-h-[32rem] bg-white/5" />
        </div>
      </div>
    </main>
  );
}
