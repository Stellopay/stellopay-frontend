import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Popular destinations users might be looking for. */
const POPULAR_LINKS = [
  { label: "Transactions", href: "/transactions", description: "View your payment history" },
  { label: "Settings", href: "/settings", description: "Manage your account" },
  { label: "Help & Support", href: "/help/support", description: "Get assistance" },
  { label: "Dashboard", href: "/dashboard", description: "Your overview" },
];

/**
 * Branded App Router 404 page for unknown Stellopay routes.
 *
 * Offers a search input that routes to the help/support search along with
 * popular-destination links so users who mistyped a URL can quickly find
 * what they were looking for.
 */
export default function NotFound() {
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search") as string;
    if (query.trim()) {
      window.location.href = `/help/support?q=${encodeURIComponent(query.trim())}`;
    }
  };

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

        {/* ── Search input ─────────────────────────────────────────── */}
        <form
          onSubmit={handleSearch}
          className="mt-8 w-full max-w-md"
          role="search"
          aria-label="Search help center"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              name="search"
              placeholder="Search help center…"
              className="h-11 w-full pl-10 pr-4 rounded-xl border-border bg-background text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow]"
              aria-label="Search help topics"
            />
          </div>
        </form>

        {/* ── CTA buttons ──────────────────────────────────────────── */}
        <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
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

        {/* ── Popular-destination links ────────────────────────────── */}
        <div className="mt-10 w-full max-w-md">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Popular destinations
          </p>
          <nav aria-label="Popular destinations" className="grid grid-cols-2 gap-2">
            {POPULAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span>
                  <span className="block font-medium">{link.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {link.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
