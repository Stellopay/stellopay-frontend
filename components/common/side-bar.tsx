"use client";
import { StellOpayLogo } from "@/public/svg/svg";
import { SearchBar } from "./search-bar";
import { NavLink } from "./nav-link";
import useSidebar from "@/context/sidebar-context";
import { X, Sidebar } from "lucide-react";

/**
 * SideBar component rendering the main application navigation sidebar.
 * Employs CSS-based transitions for layout changes instead of JS animation frameworks
 * to optimize Total Blocking Time (TBT) and prevent layout recalculation thrashing.
 */
export const SideBar = () => {
  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();

  return (
    <aside
      aria-label="Application sidebar"
      className={`bg-white dark:bg-[#101010] h-full border-r border-zinc-200 dark:border-[#1A1A1A] transition-colors duration-200 overflow-y-auto overflow-x-hidden scrollbar-hide w-full ${isMobile ? "relative z-50" : ""}`}
    >
      <div className="space-y-6 my-9 h-full">
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {(isSidebarOpen || isMobile) && (
              <div className="text-zinc-900 dark:text-white transition-colors duration-200">
                <StellOpayLogo />
              </div>
            )}

            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={isSidebarOpen}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded"
            >
              <Sidebar size={20} aria-hidden="true" />
            </button>
          </div>

          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="text-zinc-500 dark:text-zinc-400 p-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded"
            >
              <X size={24} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="space-y-8 px-4">
          <hr className="border-zinc-200 dark:border-zinc-800 border-t" />
          <div className="w-full flex items-center justify-center">
            <SearchBar />
          </div>

          <NavLink />
        </div>
      </div>
    </aside>
  );
};
