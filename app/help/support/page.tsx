"use client";
import FaqCard from "@/app/components/FaqCard";
import { CircleHelp } from "lucide-react";
import React, { useState } from "react";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("Client FAQ");

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10 bg-[#230d22] text-white flex flex-col gap-6">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Help/Support</h1>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row mb-6 sm:mb-8 gap-2 sm:gap-0">
        {["Client FAQ", "Contact Support"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-5 py-2 sm:py-3 border border-[#2d2d2d] cursor-pointer text-sm sm:text-base font-medium transition ${
              activeTab === tab
                ? `bg-white ${
                    activeTab == "Client FAQ" ? "rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none" : "rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none"
                  } text-black shadow`
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Card Container */}
      <div className="w-full bg-[#0D0D0D80] border border-[#2D2D2D] px-4 pt-4 pb-6 rounded-[0.875rem] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center border border-[#2E2E2E] rounded-[0.5rem] w-[2rem] h-[2rem]">
            <CircleHelp color="#E5E5E5" />
          </div>
          <h3 className="text-base font-normal text-[#E5E5E5]">
            Frequently Asked Questions
          </h3>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <FaqCard
            title="Account Management"
            subtitle="Update your profile, reset your password, and manage your account"
          />

          <FaqCard
            title="Transaction Issues"
            subtitle="Resolve payment failures, track transactions, and dispute unauthorized charges."
          />

          <FaqCard
            title="Security & Privacy"
            subtitle="Keep your account safe with 2FA, fraud prevention, and privacy controls."
          />

          <FaqCard
            title="Payment & Transfers"
            subtitle="Learn how to send, receive, and manage payments securely and efficiently."
          />

          <FaqCard
            title="Payment & Transfers"
            subtitle="Learn how to send, receive, and manage payments securely and efficiently."
          />

          <FaqCard
            title="Account Management"
            subtitle="Update your profile, reset your password, and manage your account."
          />
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
