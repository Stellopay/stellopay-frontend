import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen p-4 sm:p-6 flex flex-col gap-4 md:gap-6 bg-[#0f0711]"
    >
      <span className="sr-only">Loading security and privacy help content</span>

      <Skeleton className="h-4 w-40" shade="dark" />

      <Skeleton className="h-6 w-72" shade="dark" />

      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-l-lg" shade="dark" />
        <Skeleton className="h-9 w-36 rounded-r-lg" shade="dark" />
      </div>

      <div className="flex gap-6 md:flex-row flex-col flex-1">
        <div className="md:max-w-80 w-full rounded-md border border-[#2D2D2D] bg-[#0f0711] flex flex-col p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-md" shade="dark" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" shade="dark" />
            ))}
          </div>
        </div>

        <div className="flex border w-full rounded-md border-[#2D2D2D] bg-[#0f0711] p-8">
          <div className="w-full space-y-4">
            <Skeleton className="h-8 w-64" shade="dark" />
            <Skeleton className="h-4 w-full" shade="dark" />
            <Skeleton className="h-4 w-3/4" shade="dark" />
            <Skeleton className="h-4 w-5/6" shade="dark" />
            <div className="pt-4 space-y-3">
              <Skeleton className="h-4 w-full" shade="dark" />
              <Skeleton className="h-4 w-full" shade="dark" />
              <Skeleton className="h-4 w-2/3" shade="dark" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
