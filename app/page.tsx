"use client";
import Image from "next/image";
import NotificationPanel from "@/components/NotificationPanel";

import DashboardPage from "@/pages/dashboard";

import { SideBar } from "./components/SideBar";
import useSidebar from "@/context/SidebarContext";
import { Sidebar } from "lucide-react";

// Mock, remove this
const notifications = [
  {
    title: "Payment Sent",
    message: "#TXN12345 · Your payment of 250 XLM to...",
    read: false
  },
  {
    title: "Payment Received",
    message: "#TXN12345 · You've received 500 USDC...",
    read: true
  },
  {
    title: "Low Balance Alert",
    message: "Your balance is below 50 XLM. Consider adding...",
    read: false
  }
];

export default function Home() {
  // return (
  //   <>
  // <DashboardPage/>

  //   <div className="bg-[#201322] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
  //     <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
  //       <NotificationPanel notifications={notifications} />

  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();

  return (
    <>
      <DashboardPage />

      <div className="relative bg-[#201322]">
        {/* Main Grid Layout */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isMobile
              ? isSidebarOpen
                ? "grid-cols-1" // Mobile with fullscreen sidebar
                : "grid-cols-1" // Mobile without sidebar
              : isSidebarOpen
                ? "grid-cols-[16.25rem_1fr]" // Desktop expanded
                : "grid-cols-[6rem_1fr]" // Desktop collapsed
          }`}
        >
          {/* Only render sidebar in grid for desktop */}
          {!isMobile && <SideBar />}

          {/* Main content area */}
          <div className="bg-[#201322] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="absolute left-4 top-8 z-50"
            >
              <Sidebar className="text-white" />
            </button>

            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
              {" "}
              <NotificationPanel notifications={notifications} />
            </main>
          </div>
        </div>

        {/* Mobile fullscreen sidebar - renders outside of grid */}
        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black  ">
            <div className="h-full w-full sm:w-4/5 max-w-sm bg-[#101010] overflow-auto">
              <SideBar />
            </div>
          </div>
        )}
      </div>
      {/* </main>
      </div> */}
    </>
  );
}
