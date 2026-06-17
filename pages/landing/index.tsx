import { KeyFeatures } from "@/components/landing/key-features";
import Hero from "@/components/landing/hero";
import Footer from "@/components/common/footer";
import BenefitsSection from "@/components/landing/benefits";
import ValuePropositions from "@/components/landing/value-propositions";
import GetStartedCTA from "@/components/landing/get-started-cta";
import { StatsCards } from "@/components/landing/stats-cards";
import Navbar from "@/components/landing/navbar";
import dynamic from "next/dynamic";
import Skeleton from "@/components/ui/skeleton";
import { ILLUSTRATIVE_STATS } from "@/lib/demo-data";

const HowItWorks = dynamic(() => import("@/components/landing/how-it-works"), {
  loading: () => (
    <div className="w-full py-20 bg-white dark:bg-[#0D0D0D]" aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading how it works section...</span>
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
    </div>
  ),
  ssr: true,
});

const EnterpriseSolutionSection = dynamic(() => import("@/components/landing/enterprise-section"), {
  loading: () => (
    <div className="w-full py-20 bg-white dark:bg-[#0D0D0D]" aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading enterprise solution...</span>
      <div className="max-w-[1095px] mx-auto px-4">
        <Skeleton className="h-96 rounded-[48px]" shade="dark" />
      </div>
    </div>
  ),
  ssr: true,
});

const FAQSection = dynamic(() => import("@/components/landing/faq-section"), {
  loading: () => (
    <div className="w-full py-20 bg-white dark:bg-[#040404]" aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading frequently asked questions...</span>
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
    </div>
  ),
  ssr: true,
});

/**
 * LandingPage component rendering the StelloPay landing page.
 * Code-splits below-the-fold sections (HowItWorks, EnterpriseSolutionSection, FAQSection)
 * to reduce the initial load bundle size and optimize LCP/TBT metrics.
 * The statistics are loaded from a centralized demo-data configuration (ILLUSTRATIVE_STATS)
 * and marked as illustrative.
 */
export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <section className="bg-[#F5F3FF] dark:bg-[#0F0A14] py-12 md:py-16 px-4">
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
      <KeyFeatures />
      <HowItWorks />
      <ValuePropositions />
      <EnterpriseSolutionSection />
      <BenefitsSection />
      <FAQSection />
      <GetStartedCTA />
      <Footer />
    </div>
  );
}
