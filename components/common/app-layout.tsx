"use client";

import type React from "react";
import { SideBar } from "./side-bar";
import Navbar from "@/components/common/navbar";
import useSidebar from "@/context/sidebar-context";
import { AppLayoutProps } from "@/types/ui";

export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen, isMobile } = useSidebar();

  return (
    <div className="relative min-h-screen">
      {/* Sidebar for desktop - fixed position */}
      {!isMobile && (
      <div
          className={`fixed left-0 top-0 h-screen z-30 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-[16.25rem]" : "w-[6rem]"
          }`}
        >
          <SideBar />
        </div>
      )}

      {/* Main content area - with margin to account for sidebar */}
      <div
        className={`relative min-h-screen transition-all duration-300 ease-in-out ${
          isMobile
            ? "ml-0"
            : isSidebarOpen
              ? "ml-[16.25rem]"
              : "ml-[6rem]"
        }`}
      >
          <Navbar />
          <main className="flex flex-col">{children}</main>
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
