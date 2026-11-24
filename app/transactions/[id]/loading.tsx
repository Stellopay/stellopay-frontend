import Skeleton from "@/components/ui/skeleton";

export default function TransactionLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-4xl px-6 py-10"
    >
      <span className="sr-only">Loading transaction details</span>
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-6 h-9 w-64" />
      <Skeleton className="mt-8 h-64 w-full rounded-xl" />
    </main>
  );
}
