import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Branded App Router 404 page for unknown Stellopay routes.
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground"
    >
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Stellopay
        </p>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          The route you tried to open does not exist. Head back to Stellopay or
          continue from your dashboard.
        </p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">Go home</Link>
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
