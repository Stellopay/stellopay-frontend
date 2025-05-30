"use client";

import DashboardPage from "@/pages/dashboard";
import useSidebar from "@/context/SidebarContext";
import { Sidebar } from "lucide-react";
import { SideBar } from "../components/SideBar";
import TransactionsContent from "@/components/transactions/TransactionsContent";

export default function TransactionsPage() {
  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();

  return (
    <div className="relative">
      {/* Main Grid Layout - Same pattern as your home page */}
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
        {/* Sidebar - Only render in grid for desktop */}
        {!isMobile && <SideBar />}

        {/* Main content area */}
        <div className="bg-[#1a0c1d] min-h-screen relative">
          {/* Sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="absolute left-4 top-8 z-50"
          >
            <Sidebar className="text-white" />
          </button>

          {/* Your existing dashboard header */}
          <DashboardPage />

          {/* New transactions content */}
          <TransactionsContent />
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
