"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Props that Next.js passes to a route-segment `error.tsx` boundary.
 *
 * - `error.digest` is a server-generated hash for the underlying error and is
 *   the only identifier we ever surface or log. The raw `message`/`stack` is
 *   kept off the UI in production.
 * - `reset()` re-renders the dashboard segment that errored.
 */
type RouteError = Error & { digest?: string };

type DashboardErrorProps = {
  error: RouteError;
  reset: () => void;
};

/**
 * Dashboard-scoped error boundary for the App Router.
 *
 * Catches render errors only within the dashboard route segment, preventing
 * them from bubbling up to the root `app/error.tsx`. The surrounding dashboard
 * layout (sidebar, navbar, etc.) remains mounted so the rest of the
 * application stays usable.
 *
 * Renders an accessible recovery surface with a "Try again" action wired to
 * Next's `reset()`.
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    const reference = error?.digest ?? "no-digest";
    // Routed through console for now; swap in an observability hook later
    // without changing the boundary's public contract.
    console.error("[app/dashboard/error] uncaught dashboard route error", {
      digest: reference,
    });
  }, [error]);

  const showDevDetails =
    process.env.NODE_ENV !== "production" && Boolean(error?.message);

  return (
    <main
      role="alert"
      aria-live="assertive"
      className="min-h-[60vh] flex items-center justify-center bg-background text-foreground px-6"
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold text-destructive">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected error while loading your dashboard. You can retry
          to recover.
        </p>

        {showDevDetails ? (
          <pre
            data-testid="dashboard-error-dev-details"
            className="text-left text-xs text-muted-foreground bg-muted/40 p-3 rounded-md overflow-auto"
          >
            {error.message}
          </pre>
        ) : null}

        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </main>
  );
}
