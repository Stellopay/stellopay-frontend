import { KeyFeatures } from "@/components/landing/key-features";
import Hero from "@/components/landing/hero";
import Footer from "@/components/common/footer";
import BenefitsSection from "@/components/landing/benefits";
import HowItWorks from "@/components/landing/how-it-works";
import ValuePropositions from "@/components/landing/value-propositions";
import GetStartedCTA from "@/components/landing/get-started-cta";
import FAQSection from "@/components/landing/faq-section";
import { StatsCards } from "@/components/landing/stats-cards";
import Navbar from "@/components/landing/navbar";
import EnterpriseSolutionSection from "@/components/landing/enterprise-section";
import { ILLUSTRATIVE_STATS } from "@/lib/demo-data";

/**
 * LandingPage component.
 * Renders the marketing landing page including features, benefits, FAQs, and illustrative statistics.
 * The statistics are loaded from a centralized demo-data configuration and marked as illustrative.
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
