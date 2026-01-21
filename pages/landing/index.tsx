"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyFeatures } from "@/components/landing/key-features";
import Hero from "./hero";
import Footer from "@/components/common/footer";
// import DashBoard from "@/components/dashboard/dashboard-page"
import LandingPageNavBar from "@/components/landing/landing-page-nav-bar";
import BenefitsSection from "@/components/landing/benefits";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Handle hash navigation on page load
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  return (
    <div>
      <LandingPageNavBar />
       {/* Removed: <DashBoard /> - this shouldn't be on the landing page */}
      <Hero />
      <KeyFeatures />
      <BenefitsSection />
      <Footer />
    </div>
  );
}
