"use client";

import NotificationPanel from "@/components/NotificationPanel";
import DashboardPage from "@/pages/dashboard";
import { SideBar } from "./components/SideBar";
import useSidebar from "@/context/SidebarContext";
import { Sidebar } from "lucide-react";

// Mock notifications (remove when you fetch real data)
const notifications = [
  {
    title: "Payment Sent",
    message: "#TXN12345 · Your payment of 250 XLM to...",
    read: false,
  },
  {
    title: "Payment Received",
    message: "#TXN12345 · You've received 500 USDC...",
    read: true,
  },
  {
    title: "Low Balance Alert",
    message: "Your balance is below 50 XLM. Consider adding...",
    read: false,
  },
];

export default function Home() {
  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();

  return (
    <>
      <DashboardPage />

      <div className="relative bg-[#201322]">
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isMobile
              ? "grid-cols-1"
              : isSidebarOpen
              ? "grid-cols-[16.25rem_1fr]"
              : "grid-cols-[6rem_1fr]"
          }`}
        >
          {/* Sidebar for desktop */}
          {!isMobile && <SideBar />}

          {/* Main content */}
          <div className="bg-[#201322] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="absolute left-4 top-8 z-50"
            >
              <Sidebar className="text-white" />
            </button>

            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
              <NotificationPanel notifications={notifications} />
            </main>
          </div>
        </div>

        {/* Mobile fullscreen sidebar */}
        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black">
            <div className="h-full w-full sm:w-4/5 max-w-sm bg-[#101010] overflow-auto">
              <SideBar />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
