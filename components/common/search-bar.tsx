"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSidebar from "@/context/sidebar-context";
import { SearchIcon } from "@/public/svg/svg";

export const SearchBar = () => {
  const { isSidebarOpen, isMobile } = useSidebar();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Show expanded search on mobile or when desktop sidebar is expanded
  const isExpanded = isMobile || (isSidebarOpen && !isMobile);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Navigate to transactions page with search query
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={isExpanded ? "Search" : ""}
        value={searchQuery}
        onChange={handleSearch}
        onKeyPress={handleKeyPress}
        className={`border border-[#2D333E] bg-[#0D0D0D] text-sm font-normal text-[#98A2B3] pr-3 py-2 focus:border outline-none focus:border-[#464d5c] w-full ${
          isExpanded ? "pl-10 rounded-sm" : "!px-2 pl-6 rounded-lg"
        }`}
      />
      <div
        className={`absolute ${isExpanded ? "left-3" : "left-1/2 -translate-x-1/2"} top-1/2 -translate-y-1/2`}
      >
        <SearchIcon />
      </div>
    </div>
  );
};
