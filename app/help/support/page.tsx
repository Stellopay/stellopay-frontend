"use client";

import FaqCard from "@/components/common/FaqCard";
import SupportTabs from "@/components/common/SupportTabs";
import { CircleHelp } from "lucide-react";
import { useState } from "react";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("Client FAQ");

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 gap-6 text-white flex flex-col">
        {/* Shared Tabs Component with FAQ content as children */}
        <SupportTabs activeTab={activeTab} setActiveTab={setActiveTab}>
          {/* FAQ Content - only shows when "Client FAQ" tab is active */}
          <div className="w-full bg-[#0D0D0D80] border border-[#2D2D2D] p-4 rounded-[0.875rem] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center border border-[#2E2E2E] rounded-[0.5rem] w-[2rem] h-[2rem]">
                <CircleHelp color="#E5E5E5" />
              </div>
              <h3 className="text-base font-normal text-[#E5E5E5]">
                Frequently Asked Questions
              </h3>
            </div>

            {/* FAQ Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FaqCard
                title="Account Management"
                subtitle="Update your profile, reset your password, and manage your account"
                link="/help/support/accountManagement"
              />
              <FaqCard
                title="Transaction Issues"
                subtitle="Resolve payment failures, track transactions, and dispute unauthorized charges."
                link="/help/support/transactionIssues"
              />
              <FaqCard
                title="Security & Privacy"
                subtitle="Keep your account safe with 2FA, fraud prevention, and privacy controls."
                link="/help/support/securityPrivacy"
              />
              <FaqCard
                title="Payment & Transfers"
                subtitle="Learn how to send, receive, and manage payments securely and efficiently."
                link="/help/support/paymentTransfers"
              />
              <FaqCard
                title="Payment & Transfers"
                subtitle="Learn how to send, receive, and manage payments securely and efficiently."
                link="/help/support/paymentTransfers"
              />
              <FaqCard
                title="Account Management"
                subtitle="Update your profile, reset your password, and manage your account."
                link="/help/support/accountManagement"
              />
            </div>
          </div>
        </SupportTabs>
      </div>
    </>
  );
};

export default SupportPage;
