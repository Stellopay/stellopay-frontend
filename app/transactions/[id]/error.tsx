"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function TransactionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/transactions/[id]/error] transaction detail failed", {
      digest: error.digest ?? "no-digest",
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">Unable to load transaction</h1>
      <p className="mt-3 text-muted-foreground">
        An unexpected error occurred while loading this transaction.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
        <Link
          href="/transactions"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to transactions
        </Link>
      </div>
    </main>
  );
}
