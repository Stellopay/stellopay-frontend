"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const HELP_CENTER_URL = "/help";

export default function HelpCTASection() {
  const handleContactSupport = () => {
    // Wire to contact modal or mailto/support route
    window.location.href = "mailto:support@stellopay.com";
  };

  return (
    <section
      className="bg-white dark:bg-[#040404] py-16 md:py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="help-cta-heading"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2
          id="help-cta-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-bold font-inter tracking-tight text-[#09090B] dark:text-[#FAFAFA] mb-6 md:mb-8"
        >
          Still have questions? We&apos;re here to help
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button
            onClick={handleContactSupport}
            size="lg"
            className="w-full sm:w-auto min-w-[180px] h-12 rounded-xl bg-gradient-to-r from-[#93B4FF] via-[#A78BFA] to-[#7C3AED] dark:from-[#7C9EFF] dark:via-[#8B5CF6] dark:to-[#6D28D9] contrast-more:bg-[#5B21B6] contrast-more:bg-none text-white font-semibold shadow-md hover:opacity-90 hover:shadow-lg focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] contrast-more:shadow-none contrast-more:hover:opacity-100 transition-all"
          >
            Contact Support
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full sm:w-auto min-w-[180px] h-12 rounded-xl bg-white dark:bg-[#18181B] border-2 border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-[#FAFAFA] font-semibold shadow-sm hover:bg-[#F5F5F5] dark:hover:bg-[#27272A] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-all"
          >
            <Link href={HELP_CENTER_URL}>Visit Help Center</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
