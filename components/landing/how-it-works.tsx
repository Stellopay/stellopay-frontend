"use client";

import React from "react";
import { UserPlus, Wallet, Send } from "lucide-react";
import { VideoFacade } from "./video-facade";

const steps = [
  {
    number: "01",
    title: "Connect Your Wallet",
    description:
      "Link your preferred crypto wallet in seconds. We support all major wallets including MetaMask, Trust Wallet, and more.",
    icon: UserPlus,
    iconGradient: "bg-gradient-to-br from-[#83A7FF] to-[#83A7FF]/50",
    dotColor: "bg-[#83A7FF]",
    progressColor: "bg-[#83A7FF]",
  },
  {
    number: "02",
    title: "Make Crypto Payments",
    description:
      "Send payments instantly to anyone, anywhere. Choose from multiple cryptocurrencies with live conversion rates.",
    icon: Wallet,
    iconGradient: "bg-gradient-to-br from-[#C4F49F] to-[#C4F49F]/50",
    dotColor: "bg-[#C4F49F]",
    progressColor: "bg-[#C4F49F]",
  },
  {
    number: "03",
    title: "Receive in Naira",
    description:
      "Recipients get funds instantly in their preferred local currency with automatic conversion at competitive rates.",
    icon: Send,
    iconGradient: "bg-gradient-to-br from-[#393A9F] to-[#393A9F]/50",
    dotColor: "bg-[#393A9F]",
    progressColor: "bg-[#393A9F]",
  },
];

const metrics = [
  { label: "Transaction Volume", value: "$2.5B+" },
  { label: "Active Users", value: "150K+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Transaction Speed", value: "<3s" },
];

const HowItWorks = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 bg-white dark:bg-[#181818] font-['Inter',sans-serif]">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto text-center mb-16">
        <div className="inline-block px-4 py-1 mb-6 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#27272A] rounded-full">
          How it Works
        </div>
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
          <span className="block md:inline">From crypto to cash —</span>{" "}
          <span className="inline md:block bg-[linear-gradient(90deg,#83A7FF_0%,#8B5CF6_100%)] bg-clip-text text-transparent">
            in just three steps
          </span>
        </h2>
      </div>
      {/* Steps Section */}
      <div className="relative max-w-6xl mx-auto mb-20">
        {/* Connecting Line (Desktop) */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 dark:bg-[#27272A] -translate-y-1/2 hidden md:block z-0" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#27272A] rounded-3xl p-10 hover:shadow-md transition-shadow duration-300"
            >
              {/* Top Decorative Dot */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full flex items-center justify-center bg-white dark:bg-[#1C1C1C]">
                <div className={`size-2 rounded-full ${step.dotColor}`} />
              </div>

              {/* Large Background Step Number */}
              <div className="text-8xl font-bold text-gray-100 dark:text-gray-800 mb-6 select-none">
                {step.number}
              </div>

              {/* Icon with Glow Effect */}
              <div className="relative mb-8 inline-block">
                <div
                  className={`absolute inset-0 rounded-2xl blur-xl opacity-30 ${step.iconGradient}`}
                />
                <div
                  className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-sm ${step.iconGradient}`}
                >
                  <step.icon size={32} strokeWidth={1.5} />
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 text-md">
                {step.description}
              </p>

              {/* Bottom Progress Bar (Two separate spans) */}
              <div className="flex gap-2 items-center">
                <span
                  className={`h-1 w-8 rounded-full ${step.progressColor}`}
                />
                <span className="h-1 flex-1 bg-gray-200 dark:bg-[#27272A] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Video Section */}
      <div className="max-w-6xl mx-auto mb-20">
        <VideoFacade
          videoId="REPLACE_WITH_ACTUAL_VIDEO_ID"
          platform="youtube"
          videoTitle="See how Stellopay works in 2 minutes"
          captionsUrl="/docs/demo-transcript"
          captionsLabel="View demo transcript"
          className="mt-8 lg:mt-12 max-w-3xl mx-auto"
        />
      </div>

      {/* Metrics Section */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#1C1C1C] border border-gray-100 dark:border-[#27272A] rounded-2xl p-8 text-center shadow-sm"
          >
            <div className="text-3xl md:text-4xl font-bold mb-2 bg-[linear-gradient(90deg,#83A7FF_0%,#8B5CF6_100%)] bg-clip-text text-transparent">
              {metric.value}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
