"use client";

import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function GetStartedCTA() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedEmail(email);
  };

  return (
    <section className="bg-white dark:bg-[#040404] py-24 px-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] p-8 sm:p-16 text-center shadow-lg transition-colors duration-300">
        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#18181B] px-4 py-1.5 backdrop-blur-sm shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[14px] font-medium text-[#52525B] dark:text-gray-300 font-general">
              Join 150,000+ businesses worldwide
            </span>
          </div>

          {/* Heading */}
          <h2 className="sm:text-[72px] text-[48px] font-bold tracking-tight text-[#09090B] dark:text-[#FAFAFA] font-inter">
            Ready to revolutionize
          </h2>
          <h2 className="sm:text-[72px] text-[48px] font-bold bg-gradient-to-b from-[#83A7FF] via-[#C4F49F] to-[#83A7FF] bg-clip-text text-transparent font-inter">
            your payments?
          </h2>

          {/* Subheading */}
          <p className="mb-10 max-w-xl text-[20px] text-[#52525B] dark:text-[#A3A3A3] font-general">
            Start accepting crypto payments today and join the future of global
            commerce with StelloPay.
          </p>

          {/* Form */}
          <div className="mb-10 w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="email"
                  placeholder="Enter your work email"
                  className="h-12 w-full rounded-xl border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] pl-10 text-[16px] placeholder:text-[#A1A1AA] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[#52525B] dark:text-[#A1A1AA] dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-all font-general"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-xl bg-gradient-to-b from-[#83A7FF] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 hover:shadow-indigo-500/30 dark:shadow-none font-medium font-general transition-transform active:scale-95"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            {submittedEmail && (
              <p className="mt-3 text-sm text-[#52525B] dark:text-[#A3A3A3]" aria-live="polite">
                Thanks. We&apos;ll follow up at {submittedEmail}.
              </p>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#A3A3A3] font-general">
              <CheckCircle2 className="h-4 w-4 text-green-[#C4F49F]" />
              <span className="text-[#52525B] text-[14px] dark:text-[#A1A1AA]">
                Free 14-day trial
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#A3A3A3] font-general">
              <CheckCircle2 className="h-4 w-4 text-green-[#C4F49F]" />
              <span className="text-[#52525B] text-[14px] dark:text-[#A1A1AA]">
                No credit card required
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#A3A3A3] font-general">
              <CheckCircle2 className="h-4 w-4 text-green-[#C4F49F]" />
              <span className="text-[#52525B] text-[14px] dark:text-[#A1A1AA]">
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
