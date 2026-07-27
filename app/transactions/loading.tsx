import Skeleton from "@/components/ui/skeleton";
import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";

/**
 * Route-level loading UI for the `/transactions` segment.
 *
 * Rendered as the Suspense fallback for `app/transactions/page.tsx` while the
 * route streams in. It reproduces the transactions header band and the bordered
 * table card, then reuses {@link TransactionTableSkeleton} with the same row
 * count the page paginates by (`itemsPerPage = 6`) so the six-column table
 * keeps its dimensions and CLS stays low when real rows arrive.
 *
 * @remarks
 * Security: the skeleton renders only empty placeholder shapes — no real
 * transaction records, addresses, amounts, or other PII are loaded or shown
 * during this transient state.
 */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading transactions</span>

      {/* Header band — mirrors TransactionHeader height/spacing */}
      <div className="flex items-center justify-between px-8 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="container mx-auto py-8 px-8">
        <div className="bg-foreground border rounded-[1.5rem] border-[#2D2D2D] p-2">
          {/* Toolbar row — title + search/filter/sort controls */}
          <div className="grid items-center justify-between pb-2 md:pb-0 md:flex">
            <div className="flex items-center gap-2 p-2 mb-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-40 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>

          {/* Table body — six columns, six rows, matching the real table */}
          <TransactionTableSkeleton rows={6} />
        </div>
      </div>
    </div>
  );
}
