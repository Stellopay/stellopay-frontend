"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Props that Next.js passes to a route-segment `error.tsx` boundary.
 *
 * - `error.digest` is a server-generated hash for the underlying error and is
 *   the only identifier we ever surface or log. The raw `message`/`stack` is
 *   kept off the UI in production.
 * - `reset()` re-renders the segment that errored.
 */
type RouteError = Error & { digest?: string };

type GlobalErrorProps = {
  error: RouteError;
  reset: () => void;
};

/**
 * Root error boundary for the App Router.
 *
 * Renders an accessible recovery surface tailored to either network-shaped failures 
 * or unexpected rendering exceptions. It adjusts primary actions based on error type.
 * In production, the underlying error message and stack trace are never rendered.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const reference = error?.digest ?? "no-digest";
    // Routed through console for now; swap in an observability hook later
    // without changing the boundary's public contract.
    console.error("[app/error] uncaught route error", { digest: reference });
  }, [error]);

  const showDevDetails =
    process.env.NODE_ENV !== "production" && Boolean(error?.message);

  const isNetworkError = useMemo(() => {
    const msg = (error?.message || "").toLowerCase();
    const digest = (error?.digest || "").toLowerCase();
    
    return (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("timeout") ||
      msg.includes("failed to fetch") ||
      digest.includes("fetch") ||
      digest.includes("network")
    );
  }, [error]);

  const errorTitle = isNetworkError 
    ? "Connection issue" 
    : "Something went wrong";
    
  const errorMessage = isNetworkError
    ? "We couldn't connect to our servers. Please check your internet connection and try again."
    : "We hit an unexpected error while loading this page. You can try again or head back to your dashboard.";

  return (
    <main
      role="alert"
      aria-live="assertive"
      className="min-h-screen flex items-center justify-center bg-background text-foreground px-6"
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold text-destructive">
          {errorTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {errorMessage}
        </p>

        {showDevDetails ? (
          <pre
            data-testid="error-dev-details"
            className="text-left text-xs text-muted-foreground bg-muted/40 p-3 rounded-md overflow-auto"
          >
            {error.message}
          </pre>
        ) : null}

        <div className="flex items-center justify-center gap-3">
          {isNetworkError ? (
            <>
              <Button onClick={() => reset()}>Try again</Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
              <Button variant="outline" onClick={() => reset()}>Try again</Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
