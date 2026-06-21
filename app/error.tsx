"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * App Router segment error boundary for recoverable route failures.
 *
 * Security: user-facing copy stays generic so runtime messages, stack traces,
 * and internal paths are not exposed in production.
 */
export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    if (error.digest) {
      console.error("Route error digest:", error.digest);
    }
  }, [error.digest]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section
        role="alert"
        aria-labelledby="root-error-title"
        className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center"
      >
        <p className="mb-4 text-sm font-medium text-destructive">
          Something went wrong
        </p>
        <h1
          id="root-error-title"
          className="text-4xl font-semibold text-foreground sm:text-5xl"
        >
          We could not load this page
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Try again from here, or continue from your dashboard while we recover
          the route.
        </p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button
            type="button"
            size="lg"
            onClick={reset}
            className="w-full sm:w-auto"
          >
            Try again
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
