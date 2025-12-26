"use client";

import Link from "next/link";
import LandingPageNavBar from "@/components/landing/landing-page-nav-bar";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#201322] to-[#181028] text-white">
      <LandingPageNavBar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-32">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{ fontFamily: "Clash Display, sans-serif" }}>
            Coming Soon
          </h1>
          <p className="text-xl md:text-2xl text-[#bdb6c9] mb-8" style={{ fontFamily: "General Sans, sans-serif" }}>
            We're working on something amazing. Pricing information will be available soon.
          </p>
          <Link href="/">
            <button className="bg-[#598EFF] hover:bg-[#598EFF]/80 text-white font-semibold py-3 px-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#5b5bf6] focus:ring-offset-2 cursor-pointer">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

