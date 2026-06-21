import { TransactionTableSkeleton } from "@/components/ui/table-skeleton";
import { CardSkeleton } from "@/components/ui/card-skeleton";

export default function TransactionsLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Loading transactions"
      className="min-h-screen text-white"
    >
      <span className="sr-only">Loading transactions...</span>
      <div className="container mx-auto px-8 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <CardSkeleton showHeader={false} lines={2} className="border-0 p-0" />
          <div className="flex gap-2">
            <CardSkeleton showHeader={false} lines={1} className="h-10 w-40 border-[#2D2D2D]" />
            <CardSkeleton showHeader={false} lines={1} className="h-10 w-24 border-[#2D2D2D]" />
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-[#2D2D2D] bg-foreground p-2">
          <TransactionTableSkeleton rows={6} />
        </div>
      </div>
    </main>
  );
}
