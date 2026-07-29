"use client";

import FaqCard from "@/components/common/faq-card";
import SupportTabs from "@/components/common/support-tabs";
import TicketStatusWidget from "@/components/help-support/ticket-status-widget";
import { Input } from "@/components/ui/input";
import { CircleHelp, Search, SearchX, X } from "lucide-react";
import { useState } from "react";
import { getDemoSupportTickets } from "@/lib/demo-data-support";
import { filterTopics } from "@/lib/help-center-data";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("Client FAQ");
  const [searchQuery, setSearchQuery] = useState("");
  const supportTickets = getDemoSupportTickets();
  const filteredTopics = filterTopics(searchQuery);

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
          <div className="w-full bg-[#0D0D0D80] border border-[#2D2D2D] p-4 rounded-[0.875rem] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center border border-[#2E2E2E] rounded-[0.5rem] w-[2rem] h-[2rem]">
                <CircleHelp color="#E5E5E5" />
              </div>
              <h3 className="text-base font-normal text-[#E5E5E5]">
                Frequently Asked Questions
              </h3>
            </div>

            {/* Prominent Search */}
            <div role="search" aria-label="Search help articles">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#707070] focus-visible:border-[#598EFF] rounded-lg h-11"
                  aria-label="Search help articles"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707070] hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Result count / empty state */}
            {searchQuery && filteredTopics.length > 0 && (
              <p
                className="text-sm text-[#707070]"
                role="status"
                aria-live="polite"
              >
                Showing {filteredTopics.length}{" "}
                {filteredTopics.length === 1 ? "result" : "results"}
              </p>
            )}

            {filteredTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredTopics.map((topic) => (
                  <FaqCard
                    key={topic.id}
                    title={topic.title}
                    subtitle={topic.subtitle}
                    link={topic.link}
                    highlightQuery={searchQuery}
                  />
                ))}
              </div>
            ) : (
              searchQuery && (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <SearchX
                    className="h-12 w-12 text-[#707070] mb-4"
                    aria-hidden="true"
                  />
                  <p className="text-[#E5E5E5] font-medium">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-sm text-[#707070] mt-1">
                    Try searching for different keywords like
                    &ldquo;password&rdquo; or &ldquo;payment&rdquo;
                  </p>
                </div>
              )
            )}
          </div>
        </SupportTabs>
      </div>
    </>
  );
};

export default SupportPage;
