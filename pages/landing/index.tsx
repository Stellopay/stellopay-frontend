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

const defaultStats = [
  { value: "$2.5B+", label: "Transaction Volume" },
  { value: "150K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "<3s", label: "Transaction Speed" },
];

export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <section className="bg-[#F5F3FF] dark:bg-[#0F0A14] py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <StatsCards stats={defaultStats} />
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
