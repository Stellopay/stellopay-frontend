"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Props that Next.js passes to a route-segment `error.tsx` boundary.
 *
 * - `error.digest` is a server-generated hash for the underlying error and is
 *   the only identifier we ever surface or log. The raw `message`/`stack` is
 *   kept off the UI in production.
 * - `reset()` re-renders the transactions segment that errored.
 */
type RouteError = Error & { digest?: string };

type TransactionsErrorProps = {
  error: RouteError;
  reset: () => void;
};

/**
 * Transactions-scoped error boundary for the App Router.
 *
 * Catches render errors only within the transactions route segment,
 * preventing them from bubbling up to the root `app/error.tsx`. The
 * surrounding layout (sidebar, navbar, etc.) remains mounted so the rest
 * of the application stays usable.
 *
 * Renders a Sentry-ready fallback surface via the shared `ErrorState`
 * component: event ID placeholder, retry action wired to Next's `reset()`,
 * and a report-issue link.
 */
export default function TransactionsError({
  error,
  reset,
}: TransactionsErrorProps) {
  useEffect(() => {
    const reference = error?.digest ?? "no-digest";
    console.error("[app/transactions/error] uncaught transactions route error", {
      digest: reference,
    });
  }, [error]);

  const showDevDetails =
    process.env.NODE_ENV !== "production" && Boolean(error?.message);

  return (
    <main
      className="min-h-[60vh] flex items-center justify-center bg-background text-foreground px-6"
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <ErrorState
          title="Something went wrong"
          description="We hit an unexpected error while loading your transactions. You can retry or report the issue."
          eventId={error?.digest ?? undefined}
          reportLink="/help/support"
          onRetry={reset}
        />

        {showDevDetails ? (
          <pre
            data-testid="transactions-error-dev-details"
            className="text-left text-xs text-muted-foreground bg-muted/40 p-3 rounded-md overflow-auto"
          >
            {error.message}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
