import Hero from "@/components/landing/hero";
import Navbar from "@/components/landing/navbar";
import dynamic from "next/dynamic";
import Skeleton from "@/components/ui/skeleton";
import { ILLUSTRATIVE_STATS } from "@/lib/demo-data";

/**
 * Shared shell for a deferred section's loading fallback.
 *
 * Reserves the section's vertical rhythm so swapping the skeleton for real
 * content does not shift layout, and announces the pending state politely
 * rather than assertively so it never interrupts a screen reader mid-sentence.
 */
export function SectionFallback({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

const HowItWorks = dynamic(() => import("@/components/landing/how-it-works"), {
  loading: () => (
    <SectionFallback label="Loading how it works section..." className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0D0D0D]">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" shade="dark" />
          <Skeleton className="h-10 w-64 rounded-lg" shade="dark" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-64 rounded-3xl" shade="dark" />
          <Skeleton className="h-64 rounded-3xl" shade="dark" />
          <Skeleton className="h-64 rounded-3xl" shade="dark" />
        </div>
      </div>
    </SectionFallback>
  ),
  ssr: true,
});

const EnterpriseSolutionSection = dynamic(
  () => import("@/components/landing/enterprise-section"),
  {
    loading: () => (
      <SectionFallback label="Loading enterprise solution..." className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0D0D0D]">
        <div className="max-w-273.75 mx-auto px-4">
          <Skeleton className="h-96 rounded-[48px]" shade="dark" />
        </div>
      </SectionFallback>
    ),
    ssr: true,
  },
);

const TestimonialsSection = dynamic(
  () => import("@/components/landing/testimonials-section"),
  {
    loading: () => (
      <SectionFallback label="Loading testimonials..." className="w-full py-16 sm:py-20 lg:py-24 bg-[#FAFAFA] dark:bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" shade="dark" />
            <Skeleton className="h-10 w-72 rounded-lg" shade="dark" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56 rounded-2xl" shade="dark" />
            <Skeleton className="h-56 rounded-2xl" shade="dark" />
            <Skeleton className="h-56 rounded-2xl" shade="dark" />
          </div>
        </div>
      </SectionFallback>
    ),
    ssr: true,
  },
);

const FAQSection = dynamic(() => import("@/components/landing/faq-section"), {
  loading: () => (
    <SectionFallback label="Loading frequently asked questions..." className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#040404]">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="flex flex-col items-center space-y-4 mb-12">
          <Skeleton className="h-6 w-16 rounded-full" shade="dark" />
          <Skeleton className="h-10 w-80 rounded-lg" shade="dark" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-[20px]" shade="dark" />
          <Skeleton className="h-20 rounded-[20px]" shade="dark" />
          <Skeleton className="h-20 rounded-[20px]" shade="dark" />
        </div>
      </div>
    </SectionFallback>
  ),
  ssr: true,
});

const StatsCards = dynamic(
  () => import("@/components/landing/stats-cards").then((m) => m.StatsCards),
  {
    loading: () => (
      <SectionFallback label="Loading statistics..." className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
          <Skeleton className="h-32 rounded-2xl" shade="dark" />
        </div>
      </SectionFallback>
    ),
    ssr: true,
  },
);

const FeaturesIntro = dynamic(
  () => import("@/components/landing/features-intro").then((m) => m.FeaturesIntro),
  {
    loading: () => (
      <SectionFallback
        label="Loading features..."
        className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0D0D0D]"
      >
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-6 w-28 rounded-full" shade="dark" />
            <Skeleton className="h-10 w-72 rounded-lg" shade="dark" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton className="h-56 rounded-3xl" shade="dark" />
            <Skeleton className="h-56 rounded-3xl" shade="dark" />
            <Skeleton className="h-56 rounded-3xl" shade="dark" />
          </div>
        </div>
      </SectionFallback>
    ),
    ssr: true,
  },
);

const ValuePropositions = dynamic(
  () => import("@/components/landing/value-propositions"),
  {
    loading: () => (
      <SectionFallback
        label="Loading value propositions..."
        className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0D0D0D]"
      >
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" shade="dark" />
            <Skeleton className="h-10 w-80 rounded-lg" shade="dark" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton className="h-48 rounded-3xl" shade="dark" />
            <Skeleton className="h-48 rounded-3xl" shade="dark" />
            <Skeleton className="h-48 rounded-3xl" shade="dark" />
          </div>
        </div>
      </SectionFallback>
    ),
    ssr: true,
  },
);

const BenefitsSection = dynamic(() => import("@/components/landing/benefits"), {
  loading: () => (
    <SectionFallback
      label="Loading benefits..."
      className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0D0D0D]"
    >
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-6 w-20 rounded-full" shade="dark" />
          <Skeleton className="h-10 w-72 rounded-lg" shade="dark" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <Skeleton className="h-52 rounded-3xl" shade="dark" />
          <Skeleton className="h-52 rounded-3xl" shade="dark" />
          <Skeleton className="h-52 rounded-3xl" shade="dark" />
        </div>
      </div>
    </SectionFallback>
  ),
  ssr: true,
});

const GetStartedCTA = dynamic(
  () => import("@/components/landing/get-started-cta"),
  {
    loading: () => (
      <SectionFallback
        label="Loading call to action..."
        className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0D0D0D]"
      >
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-64 rounded-4xl" shade="dark" />
        </div>
      </SectionFallback>
    ),
    ssr: true,
  },
);

const Footer = dynamic(() => import("@/components/common/footer"), {
  loading: () => (
    <SectionFallback
      label="Loading footer..."
      className="w-full py-16 bg-white dark:bg-[#0D0D0D]"
    >
      <div className="max-w-6xl mx-auto px-4">
        <Skeleton className="h-48 rounded-2xl" shade="dark" />
      </div>
    </SectionFallback>
  ),
  ssr: true,
});

/**
 * LandingPage component rendering the StelloPay landing page.
 *
 * Only the two above-the-fold sections — Navbar and Hero — are imported
 * eagerly. Every section below them is code-split with `next/dynamic` so the
 * browser does not parse their JS (including the framer-motion trees in
 * how-it-works and faq-section) before the hero becomes interactive.
 *
 * All deferred sections use `ssr: true`, so the server still renders their
 * markup into the initial HTML. Deferring only the client bundle keeps SEO
 * crawlability and no-JS rendering intact, and means the skeleton fallbacks
 * are a hydration-time state rather than a blank first paint.
 *
 * The statistics are loaded from a centralized demo-data configuration (ILLUSTRATIVE_STATS)
 * and marked as illustrative.
 *
 * Heading Tree Structure (WCAG 2.1 AA / SEO Audit):
 * - H1: Hero Page Headline (hero.tsx)
 * - H2: Features Introductory Section (features-intro.tsx) -> H3 cards
 * - H2: How It Works Steps (how-it-works.tsx) -> H3 steps
 * - H2: Value Propositions (value-propositions.tsx) -> H3 cards
 * - H2: Enterprise Solution Section (enterprise-section.tsx)
 * - H2: Product Benefits Section (benefits.tsx) -> H3 cards
 * - H2: Frequently Asked Questions (faq-section.tsx) -> H3 questions (W3C standard Accordion)
 * - H2: Get Started Call-To-Action (get-started-cta.tsx)
 */
export default function LandingPage() {
  return (
    <div className="landing-print-root">
      <Navbar />
      <Hero />
      <section className="bg-[#F5F3FF] dark:bg-[#0F0A14] py-16 sm:py-20 lg:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              Illustrative Demo Data
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stats shown below are for demonstration and testing purposes.
            </p>
          </div>
          <StatsCards stats={ILLUSTRATIVE_STATS} />
        </div>
      </section>
      <FeaturesIntro />
      <HowItWorks />
      <TestimonialsSection />
      <ValuePropositions />
      <EnterpriseSolutionSection />
      <BenefitsSection />
      <FAQSection />
      <GetStartedCTA />
      <Footer />
    </div>
  );
}
