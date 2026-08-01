"use client";

import { Shield, Zap, Globe, Lock, TrendingUp, Layers } from "lucide-react";
import { FeatureCardGrid } from "./feature-card-grid";
import { FeaturesGridProps, FeatureGridItem } from "@/types/landing";
import { Button } from "@/components/ui/button";

const features: FeatureGridItem[] = [
  {
    icon: Shield,
    title: "Zero Transaction Fees",
    description:
      "Say goodbye to hidden charges. StelloPay leverages blockchain efficiency to eliminate transaction costs entirely.",
    link: "#features",
  },
  {
    icon: Zap,
    title: "Instant Global Payments",
    description:
      "Send and receive crypto payments instantly across borders. No delays, no intermediaries, just pure speed.",
    link: "#features",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    description:
      "Accept payments in multiple cryptocurrencies and fiat currencies with automatic conversion at competitive rates.",
    link: "#features",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    description:
      "Your funds are protected with military-grade encryption and multi-signature authentication protocols.",
    link: "#features",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description:
      "Track every transaction with comprehensive dashboards and detailed reporting tools for complete visibility.",
    link: "#features",
  },
  {
    icon: Layers,
    title: "Seamless Integration",
    description:
      "Connect StelloPay to your existing systems with our powerful API and developer-friendly documentation.",
    link: "#features",
  },
];

export default function FeaturesGrid({ className = "" }: FeaturesGridProps) {
  return (
    <section
      className={`py-16 px-4 md:px-8 lg:px-16 bg-white dark:bg-[#0a0a0a] ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Label */}
          <div className="inline-flex items-center justify-center mb-4">
            <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              Features That Make Us Different
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-black dark:text-white">
              Everything you need to{" "}
            </span>
            <span className="bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6] bg-clip-text text-transparent">
              scale your business
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Built for modern businesses. Designed for global payments. Powered
            by blockchain technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <FeatureCardGrid key={index} index={index} {...feature} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6">
            Explore all features and capabilities
          </p>
          <Button
            variant="outline"
            className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#252525] px-8 py-6 text-base"
          >
            View Full Feature List
          </Button>
        </div>
      </div>
    </section>
  );
}
