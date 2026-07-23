"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

/** Landing-page FAQ copy describing Stellar-specific wallet, asset, and fee expectations. */
const faqData: FAQItem[] = [
  {
    question: "Do I need a crypto wallet?",
    answer:
      "Yes. StelloPay connects to Stellar wallets such as Freighter, Albedo, and xBull so you can approve payments on Stellar mainnet or testnet. StelloPay never asks for your seed phrase or private key.",
  },
  {
    question: "What are the supported currencies?",
    answer:
      "StelloPay focuses on Stellar assets such as XLM and USDC on Stellar. Supported assets can vary by network, so always confirm whether you are using Stellar mainnet or testnet before sending funds.",
  },
  {
    question: "Have any questions? We've Got Your Answers",
    answer:
      "Our support team can help with Stellar wallet setup, supported assets, network selection, and payment questions. You can reach out to us via email or our help center.",
  },
  {
    question: "StelloPay charges lower fees than traditional services?",
    answer:
      "Stellar network fees are typically fractions of a cent, which can make on-chain payments more cost-efficient than many traditional rails. Review any StelloPay service fees and the selected Stellar network before confirming a payment.",
  },
];

const AccordionItem = ({
  item,
  isOpen,
  onToggle,
  buttonRef,
  onKeyDown,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) => {
  return (
    <div
      className={cn(
        "group mb-4 rounded-[20px] transition-all duration-300",
        "bg-[#F9F9F9] dark:bg-[#121212] border border-transparent shadow-sm hover:shadow-md",
        isOpen &&
          "bg-white dark:bg-[#1A1A1A] border-[#F2F2F2] dark:border-[#262626]",
      )}
    >
      <button
        ref={buttonRef}
        onClick={onToggle}
        onKeyDown={onKeyDown}
        className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="text-lg md:text-xl font-semibold text-[#09090B] dark:text-[#FAFAFA] font-sans">
          {item.question}
        </span>
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
            isOpen
              ? "bg-gradient-to-b from-[#93B4FF] via-[#A78BFA] to-[#7C3AED] dark:from-[#7C9EFF] dark:via-[#8B5CF6] dark:to-[#6D28D9] text-white"
              : "bg-gradient-to-b from-[#93B4FF] via-[#A78BFA] to-[#7C3AED] dark:from-[#7C9EFF] dark:via-[#8B5CF6] dark:to-[#6D28D9] text-white",
          )}
        >
          {isOpen ? (
            <Minus className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          ) : (
            <Plus className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 md:px-8 md:pb-8">
              <p className="text-[#71717A] dark:text-[#A1A1AA] text-base md:text-lg leading-relaxed font-sans">
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const buttonRefs = useRef<Array<React.RefObject<HTMLButtonElement>>>(
    faqData.map(() => React.createRef<HTMLButtonElement>()),
  );

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const last = faqData.length - 1;
    let target: number | null = null;

    switch (e.key) {
      case "ArrowDown":
        target = index < last ? index + 1 : 0;
        break;
      case "ArrowUp":
        target = index > 0 ? index - 1 : last;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = last;
        break;
      default:
        return;
    }

    e.preventDefault();
    buttonRefs.current[target].current?.focus();
  };

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#040404]">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B]">
            <span className="text-xs md:text-sm font-semibold text-[#71717A] dark:text-[#A1A1AA] tracking-wider uppercase font-sans">
              FAQ
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#09090B] dark:text-white font-sans">
            Have any{" "}
            <span className="bg-gradient-to-b from-[#93B4FF] via-[#A78BFA] to-[#7C3AED] dark:from-[#7C9EFF] dark:via-[#8B5CF6] dark:to-[#6D28D9] bg-clip-text text-transparent">
              Questions?
            </span>
            <br className="hidden md:block" /> We&apos;ve Got Your Answers
          </h2>
        </div>

        {/* Accordion Container */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => toggleAccordion(index)}
              buttonRef={buttonRefs.current[index]}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        {/* Footer Support Section */}
        <div className="mt-20 md:mt-32 text-center">
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-base md:text-lg mb-8 font-sans">
            Still have questions? We&apos;re here to help
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[180px] h-14 rounded-2xl bg-gradient-to-b from-[#93B4FF] via-[#A78BFA] to-[#7C3AED] dark:from-[#7C9EFF] dark:via-[#8B5CF6] dark:to-[#6D28D9] text-white font-semibold text-lg hover:opacity-90 transition-all border-none shadow-[0_8px_30px_rgb(147,180,255,0.3)] dark:shadow-[0_8px_30px_rgb(124,62,237,0.3)]"
              asChild
            >
              <Link href="mailto:support@stellopay.com">Contact Support</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[180px] h-14 rounded-2xl bg-white dark:bg-[#09090B] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-[#FAFAFA] font-semibold text-lg hover:bg-[#F9F9F9] dark:hover:bg-[#121212] transition-all"
              asChild
            >
              <Link href="/help">Visit Help Center</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
