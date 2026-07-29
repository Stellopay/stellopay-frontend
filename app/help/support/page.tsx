"use client";

import FaqCard from "@/components/common/faq-card";
import SupportTabs from "@/components/common/support-tabs";
import TicketStatusWidget from "@/components/help-support/ticket-status-widget";
import CoachMarkOverlay from "@/components/ui/coach-mark-overlay";
import {
  CircleHelp,
  Search,
  Grid3X3,
  MessageSquareText,
  UserCog,
  ArrowRightLeft,
  Shield,
  CreditCard,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getDemoSupportTickets } from "@/lib/demo-data-support";
import { safeStorage } from "@/utils/safeStorage";

const COACH_MARK_KEY = "stellopay_help_coach_mark_dismissed";

interface CoachMarkStep {
  targetSelector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
}

const COACH_MARK_STEPS: CoachMarkStep[] = [
  {
    targetSelector: "[data-coach-search]",
    title: "Search Help Topics",
    description:
      "Use the search bar to quickly find answers to your questions. Type keywords like 'payment', 'security', or 'account' to get relevant results.",
    icon: <Search className="w-5 h-5" aria-hidden="true" />,
    position: "bottom",
  },
  {
    targetSelector: "[data-coach-categories]",
    title: "Browse by Category",
    description:
      "Explore our organized categories to find help on specific topics. Each category contains articles and guides tailored to your needs.",
    icon: <Grid3X3 className="w-5 h-5" aria-hidden="true" />,
    position: "top",
  },
  {
    targetSelector: "[data-coach-contact]",
    title: "Contact Support",
    description:
      "Can't find what you're looking for? Reach out to our support team directly. We typically respond within 24 hours.",
    icon: <MessageSquareText className="w-5 h-5" aria-hidden="true" />,
    position: "top",
  },
];

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("Client FAQ");
  const [showCoachMarks, setShowCoachMarks] = useState(false);
  const [currentCoachStep, setCurrentCoachStep] = useState(0);
  const supportTickets = getDemoSupportTickets();

  useEffect(() => {
    const dismissed = safeStorage.getItem(COACH_MARK_KEY);
    if (dismissed !== "true") {
      // Delay showing coach marks to let the page render first
      const timer = setTimeout(() => {
        setShowCoachMarks(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCoachDismiss = () => {
    setShowCoachMarks(false);
    safeStorage.setItem(COACH_MARK_KEY, "true");
  };

  const handleCoachNext = () => {
    if (currentCoachStep < COACH_MARK_STEPS.length - 1) {
      setCurrentCoachStep((prev) => prev + 1);
    } else {
      handleCoachDismiss();
    }
  };

  const handleCoachPrev = () => {
    if (currentCoachStep > 0) {
      setCurrentCoachStep((prev) => prev - 1);
    }
  };

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 gap-6 text-white flex flex-col">
        {/* Support Tickets Status Widget - always visible */}
        <div className="w-full">
          <TicketStatusWidget tickets={supportTickets} isLoading={false} />
        </div>

        {/* Shared Tabs Component with FAQ content as children */}
        <SupportTabs activeTab={activeTab} setActiveTab={setActiveTab}>
          {/* FAQ Content - only shows when "Client FAQ" tab is active */}
          <div data-coach-categories className="w-full bg-[#0D0D0D80] border border-[#2D2D2D] p-4 rounded-[0.875rem] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center border border-[#2E2E2E] rounded-[0.5rem] w-[2rem] h-[2rem]">
                <CircleHelp color="#E5E5E5" />
              </div>
              <h3 className="text-base font-normal text-[#E5E5E5]">
                Frequently Asked Questions
              </h3>
            </div>

            {/* FAQ Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FaqCard
                title="Account Management"
                subtitle="Update your profile, reset your password, and manage your account"
                link="/help/support/accountManagement"
                icon={<UserCog size={18} color="#E5E5E5" aria-hidden="true" />}
                articleCount={6}
              />
              <FaqCard
                title="Transaction Issues"
                subtitle="Resolve payment failures, track transactions, and dispute unauthorized charges."
                link="/help/support/transactionIssues"
                icon={<ArrowRightLeft size={18} color="#E5E5E5" aria-hidden="true" />}
                articleCount={6}
              />
              <FaqCard
                title="Security & Privacy"
                subtitle="Keep your account safe with 2FA, fraud prevention, and privacy controls."
                link="/help/support/securityPrivacy"
                icon={<Shield size={18} color="#E5E5E5" aria-hidden="true" />}
                articleCount={6}
              />
              <FaqCard
                title="Payment & Transfers"
                subtitle="Learn how to send, receive, and manage payments securely and efficiently."
                link="/help/support/paymentTransfers"
                icon={<CreditCard size={18} color="#E5E5E5" aria-hidden="true" />}
                articleCount={6}
              />
            </div>
          </div>
        </SupportTabs>
      </div>

      {/* Coach Mark Overlay */}
      {showCoachMarks && COACH_MARK_STEPS.length > 0 && (
        <CoachMarkOverlay
          steps={COACH_MARK_STEPS}
          currentStep={currentCoachStep}
          onNext={handleCoachNext}
          onPrev={handleCoachPrev}
          onDismiss={handleCoachDismiss}
          aria-label="Help center navigation guide"
        />
      )}
    </>
  );
};

export default SupportPage;
