"use client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import SupportTabs from "@/components/common/support-tabs";
import { useState } from "react";

export default function Loading() {
  const [activeTab, setActiveTab] = useState("Client FAQ");

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 flex flex-col gap-4 md:gap-6" aria-busy="true" aria-live="polite">
        <SupportTabs activeTab={activeTab} setActiveTab={setActiveTab}>
          {/* FAQ Content Skeleton - matching the "Client FAQ" tab layout */}
          <div className="min-h-screen flex">
            <Tabs
              defaultValue="password-security"
              orientation="vertical"
              className="flex w-full"
            >
              <div className="flex gap-6 md:flex-row flex-col flex-1">
                <div className="md:max-w-80 w-full rounded-md border border-[#2D2D2D] bg-[#0f0711] text-white flex flex-col">
                  {/* Search Bar Skeleton */}
                  <div className="px-4 pt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
                      <Input
                        placeholder="Search"
                        disabled
                        className="bg-black rounded-md border-[#2D333E] text-white placeholder-gray-400 pl-10 opacity-50 cursor-not-allowed"
                        aria-label="Search FAQ loading"
                      />
                    </div>
                  </div>

                  {/* Navigation Tabs Skeleton */}
                  <TabsList className="bg-transparent h-auto flex-col w-full space-y-1 p-4 justify-start" aria-label="Loading navigation tabs">
                    {[
                      "Profile Settings",
                      "Password & Security",
                      "Account Verification",
                      "Linked Accounts",
                      "Login Issues",
                      "Account Deactivation"
                    ].map((item, index) => (
                      <div
                        key={index}
                        className={`w-full flex items-center py-3 px-4 rounded-md ${index === 1 ? 'bg-white' : 'bg-transparent'}`}
                      >
                        <Skeleton className={`h-4 w-3/4 ${index === 1 ? 'bg-gray-300' : 'bg-[#2D2D2D]'}`} shade={index === 1 ? 'light' : 'dark'} />
                      </div>
                    ))}
                  </TabsList>
                </div>

                <div className="flex border w-full rounded-md border-[#2D2D2D] bg-[#0f0711] overflow-y-auto p-8" aria-label="Loading content area">
                  <div className="max-w-4xl w-full">
                    {/* Article Heading Skeleton */}
                    <Skeleton className="h-8 w-2/3 mb-6 bg-[#2D2D2D]" shade="dark" />

                    <div className="space-y-6">
                      <div>
                        {/* Subheading Skeleton */}
                        <Skeleton className="h-4 w-1/2 mb-2 bg-[#2D2D2D]" shade="dark" />
                        {/* Paragraph Skeleton */}
                        <SkeletonText lines={2} shade="dark" className="bg-[#2D2D2D]" />
                      </div>

                      <div>
                        {/* Section Title Skeleton */}
                        <Skeleton className="h-6 w-1/3 mb-3 bg-[#2D2D2D]" shade="dark" />
                        {/* List Skeleton */}
                        <div className="space-y-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start">
                              <Skeleton className="h-4 w-4 mr-2 rounded bg-[#2D2D2D]" shade="dark" />
                              <Skeleton className="h-4 w-full bg-[#2D2D2D]" shade="dark" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        {/* Section Title Skeleton */}
                        <Skeleton className="h-6 w-1/3 mb-3 bg-[#2D2D2D]" shade="dark" />
                        {/* List Skeleton */}
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start">
                              <Skeleton className="h-4 w-4 mr-2 rounded bg-[#2D2D2D]" shade="dark" />
                              <Skeleton className="h-4 w-5/6 bg-[#2D2D2D]" shade="dark" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        {/* Tips Section Skeleton */}
                        <Skeleton className="h-6 w-1/4 mb-3 bg-[#2D2D2D]" shade="dark" />
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start">
                              <Skeleton className="h-4 w-4 mr-2 rounded bg-[#2D2D2D]" shade="dark" />
                              <Skeleton className="h-4 w-3/4 bg-[#2D2D2D]" shade="dark" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        {/* Still Need Help Skeleton */}
                        <Skeleton className="h-6 w-1/4 mb-3 bg-[#2D2D2D]" shade="dark" />
                        <SkeletonText lines={2} shade="dark" className="mb-2 bg-[#2D2D2D]" />
                        <Skeleton className="h-4 w-1/2 bg-[#2D2D2D]" shade="dark" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs>

            <style jsx>{`
              @media (max-width: 768px) {
                .min-h-screen > div {
                  flex-direction: column;
                }
                .w-80 {
                  width: 100%;
                  height: auto;
                }
              }
            `}</style>
          </div>
        </SupportTabs>
      </div>
    </>
  );
}
