import type { Metadata } from "next";
import Link from "next/link";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { ClockAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Session Expired",
  description:
    "Your StelloPay session has expired. Please log in again to continue.",
};

export default async function SessionExpiredPage(props: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const searchParams = await props.searchParams;
  const returnTo = searchParams?.returnTo ?? "/dashboard";
  const loginHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main
      id="main-content"
      className="flex flex-col lg:flex-row items-center justify-center gap-20 p-10 md:max-w-7xl mx-auto lg:h-screen"
    >
      <section className="w-full order-1 lg:order-2">
        <div className="space-y-6">
          <h2 className="text-foreground">Stellopay</h2>
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div
              className="w-16 h-16 rounded-full bg-[#92569D]/20 flex items-center justify-center"
              aria-hidden="true"
              data-testid="clock-alert-container"
            >
              <ClockAlert className="w-8 h-8 text-[#92569D]" />
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Session Expired
            </h1>
            <p className="text-sm text-zinc-400 max-w-sm">
              Your session has expired due to inactivity. Please log in again
              to continue where you left off.
            </p>

            <div className="pt-4">
              <Link
                href={loginHref}
                className="inline-flex items-center justify-center rounded-lg bg-[#92569D] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#A85DB5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F8D2FE] focus:ring-offset-2 focus:ring-offset-black"
              >
                Log in again
              </Link>
            </div>

            {returnTo && (
              <p className="text-xs text-zinc-500">
                After logging in, you&apos;ll be redirected to{" "}
                <span className="font-medium text-zinc-400">{returnTo}</span>
              </p>
            )}

            <Link
              href="/auth/login"
              className="text-sm text-[#92569D] hover:text-[#F8D2FE] transition-colors underline underline-offset-4"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </section>
      <AuthShowcase
        title="StelloPay streamlines global payroll with fast, secure blockchain payments."
        description="Your session has timed out. Sign back in to continue."
        imagePosition="right"
      />
    </main>
  );
}
