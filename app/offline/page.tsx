import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Offline fallback page served by the service worker when a navigation
 * request fails because the device has no network connection.
 *
 * Design
 * ------
 * Intentionally minimal so it can be pre-cached as part of the app shell
 * without pulling in heavy runtime dependencies.  Matches the visual pattern
 * of `app/not-found.tsx` (design tokens, layout, CTA buttons).
 *
 * Accessibility
 * -------------
 * - `<main>` landmark with `id="main-content"` matches the skip-link target
 *   in the root layout.
 * - Heading hierarchy: single `<h1>` — screen readers announce the page title.
 * - WifiOff icon is decorative (`aria-hidden="true"`).
 * - Both CTA buttons are keyboard-accessible `<a>` elements via `Button asChild`.
 *
 * Responsiveness
 * --------------
 * - Full-width stacked buttons on narrow viewports (< sm).
 * - Side-by-side on sm+ (640 px and up).
 * - Fluid padding ensures the layout is comfortable at every breakpoint.
 */
export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground"
    >
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        {/* Decorative icon — aria-hidden so screen readers skip it */}
        <WifiOff
          className="mb-6 h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />

        <p className="mb-4 text-sm font-medium text-muted-foreground">
          StelloPay
        </p>

        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          You&rsquo;re offline
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          It looks like you&rsquo;ve lost your internet connection. Check your
          network settings and try again — StelloPay will be right here when
          you&rsquo;re back online.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          {/*
            Reload button: refreshes the current page.  A plain <button> with
            an onclick would require "use client", so we use a same-page Link
            which triggers a navigation that the SW can retry against the
            network.
          */}
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">Try again</Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
