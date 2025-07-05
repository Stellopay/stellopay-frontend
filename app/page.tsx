"use client";

import NotificationPanel from "@/components/NotificationPanel";
import DashboardPage from "@/pages/dashboard";
import { SideBar } from "../app/components/SideBar";
import useSidebar from "@/context/SidebarContext";

// Mock notifications
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
    <div className="relative bg-[#201322] min-h-screen">
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

        {/* Main content area (includes navbar + page) */}
        <div className="bg-[#201322] relative min-h-screen pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
          {/*  */}

          {/* Dashboard Page (includes navbar if any) */}
          <DashboardPage />

          <main className="flex flex-col gap-[32px] items-center mt-12">
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
  );
}
