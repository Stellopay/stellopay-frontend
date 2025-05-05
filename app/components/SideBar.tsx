"use client";
import { StellOpayLogo } from "@/public/svg/svg";
import { SearchBar } from "./SearchBar";
import { NavLink } from "./NavLink";
import useSidebar from "@/context/SidebarContext";
import { motion } from "framer-motion";
import { X } from "lucide-react"; // Import X icon for close button

export const SideBar = () => {
  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();

  return (
    <motion.aside
      className={`bg-[#101010] h-full border border-[#1A1A1A] ${isMobile ? "w-full relative z-50" : ""}`}
      initial={false}
      animate={{
        width: !isMobile && !isSidebarOpen ? "6rem" : "100%",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="space-y-6 h-full">
        {/* Top section with logo and close button */}
        <div className="px-6 py-6 flex justify-between items-center">
          {(isSidebarOpen || isMobile) && <StellOpayLogo />}

          {/* Show close button on mobile */}
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
