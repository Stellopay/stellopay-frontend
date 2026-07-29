"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Props that Next.js passes to a route-segment `error.tsx` boundary.
 *
 * - `error.digest` is a server-generated hash for the underlying error and is
 *   the only identifier we ever surface or log. The raw `message`/`stack` is
 *   kept off the UI in production.
 * - `reset()` re-renders the settings preferences segment that errored.
 */
type RouteError = Error & { digest?: string };

type SettingsPreferencesErrorProps = {
  error: RouteError;
  reset: () => void;
};

/**
 * Settings preferences-scoped error boundary for the App Router.
 *
 * Catches render errors only within the settings preferences route segment,
 * preventing them from bubbling up to the root `app/error.tsx`. The
 * surrounding layout (sidebar, navbar, etc.) remains mounted so the rest
 * of the application stays usable.
 *
 * Renders a Sentry-ready fallback surface via the shared `ErrorState`
 * component: event ID placeholder, retry action wired to Next's `reset()`,
 * and a report-issue link.
 */
export default function SettingsPreferencesError({
  error,
  reset,
}: SettingsPreferencesErrorProps) {
  useEffect(() => {
    const reference = error?.digest ?? "no-digest";
    console.error(
      "[app/settings/preferences/error] uncaught settings preferences route error",
      {
        digest: reference,
      },
    );
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
          description="We hit an unexpected error while loading your preferences. You can retry or report the issue."
          eventId={error?.digest ?? undefined}
          reportLink="/help/support"
          onRetry={reset}
        />

        {showDevDetails ? (
          <pre
            data-testid="settings-preferences-error-dev-details"
            className="text-left text-xs text-muted-foreground bg-muted/40 p-3 rounded-md overflow-auto"
          >
            {error.message}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
