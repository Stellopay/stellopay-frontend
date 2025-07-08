"use client";

import type React from "react";
import { SideBar } from "./SideBar";

import useSidebar from "@/context/SidebarContext";
import Navbar from "./Navbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen, isMobile } = useSidebar();

  return (
    <div className="relative   min-h-screen">
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

        {/* Main content area */}
        <div className=" relative  min-h-screen">
          <Navbar />
          <main className="flex flex-col">{children}</main>
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
