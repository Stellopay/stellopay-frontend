import Link from "next/link";

export default function TransactionNotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-6 text-center"
    >
      <h1 className="text-3xl font-semibold">Transaction not found</h1>
      <p className="mt-3 text-muted-foreground">
        This transaction may have been removed or the link may be incorrect.
      </p>
      <Link
        href="/transactions"
        className="mt-6 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to transactions
      </Link>
    </main>
  );
}
