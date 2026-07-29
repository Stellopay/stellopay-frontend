"use client";

import { Quote } from "lucide-react";
import Image from "next/image";
import { useId } from "react";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatarSrc?: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Stellopay transformed how we handle cross-border payments. Our customers can now pay in crypto and we receive naira instantly — no more 3-day bank delays.",
    name: "Chioma Okafor",
    role: "CEO, BloomPay Solutions",
  },
  {
    quote:
      "The integration was seamless. Within a week we had crypto payments live on our platform. Our transaction volume grew 40% in the first month.",
    name: "Emeka Nwosu",
    role: "CTO, Vesta Commerce",
  },
  {
    quote:
      "Finally, a payment solution that understands the Nigerian market. The auto-conversion feature alone saves us hours of manual reconciliation every week.",
    name: "Aisha Bello",
    role: "Finance Lead, RidgePay",
  },
  {
    quote:
      "We were hesitant about crypto payments, but Stellopay made it simple. Their support team held our hand through the entire setup process.",
    name: "Tunde Adeyemi",
    role: "Founder, PayBridge Africa",
  },
  {
    quote:
      "The real-time dashboard and analytics give us visibility we never had before. We can track every transaction from crypto deposit to naira settlement.",
    name: "Folake Martins",
    role: "Operations Director, SwiftSend",
  },
  {
    quote:
      "Stellopay's uptime and reliability are unmatched. We process over 10,000 transactions monthly and haven't experienced a single outage.",
    name: "Dele Ogunlesi",
    role: "VP Engineering, CashFlow NG",
  },
];

const INITIALS_BG = [
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-blue-500 to-cyan-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-pink-500 to-rose-600",
  "bg-gradient-to-br from-indigo-500 to-blue-600",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const avatarId = useId();

  return (
    <figure
      className="flex flex-col bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl p-6 sm:p-8 hover:shadow-md transition-shadow duration-300"
      aria-labelledby={avatarId}
    >
      <Quote
        size={28}
        className="text-[#83A7FF] dark:text-[#6B9AFF] mb-4 shrink-0"
        aria-hidden="true"
      />
      <blockquote className="flex-1">
        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </blockquote>
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-[#27272A]">
        {testimonial.avatarSrc ? (
          <Image
            src={testimonial.avatarSrc}
            alt={testimonial.name}
            width={40}
            height={40}
            className="rounded-full object-cover size-10"
          />
        ) : (
          <span
            className={`size-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${INITIALS_BG[index % INITIALS_BG.length]}`}
            aria-hidden="true"
          >
            {getInitials(testimonial.name)}
          </span>
        )}
        <figcaption id={avatarId} className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {testimonial.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {testimonial.role}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 bg-[#FAFAFA] dark:bg-[#0D0D0D]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-block px-4 py-1 mb-6 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#27272A] rounded-full">
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Trusted by{" "}
            <span className="bg-gradient-to-b from-[#83A7FF] to-[#8B5CF6] bg-clip-text text-transparent">
              businesses like yours
            </span>
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Hear from the companies that use Stellopay to power their crypto
            payment infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
