"use client";
import { StellOpayLogo } from "@/public/svg/svg";
import { SearchBar } from "./search-bar";
import { NavLink } from "./nav-link";
import useSidebar from "@/context/sidebar-context";
import { motion } from "framer-motion";
import { X, Sidebar } from "lucide-react"; // Import X icon for close button

export const SideBar = () => {
  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();

  return (
    <motion.aside
      className={`bg-[#101010] h-screen border-r border-[#1A1A1A] overflow-y-auto ${isMobile ? "w-full relative z-50" : ""}`}
      initial={false}
      animate={{
        width: !isMobile && !isSidebarOpen ? "6rem" : "100%",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="space-y-6 py-9 h-full">
        {/* Top section with logo and close button */}
        <div className="px-8 py-6 flex justify-between items-center">
          {/* Left: Sidebar toggle + Logo */}
          <div className="flex items-center gap-18">
            {(isSidebarOpen || isMobile) && <StellOpayLogo />}

            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="text-white cursor-pointer"
            >
              <Sidebar />
            </button>
          </div>

          {/* Right: Close button (mobile only) */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white p-2"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Search and nav section */}
        <div className="space-y-8 px-4">
          <hr className="border-gray-800 border-t" />
          {/* Search bar */}
          <div className="w-full flex items-center justify-center">
            <SearchBar />
          </div>

          {/* Nav links */}
          <NavLink />
        </div>
      </div>
    </motion.aside>
  );
};
