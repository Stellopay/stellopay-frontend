"use client";
// components/Navbar.tsx
import { Bell, Settings, HelpCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ConnectWalletButton from "@/components/wallet/connect-wallet-button";
import NotificationPanel from "@/components/common/notification-panel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationItem } from "@/types/notification-item";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications] = useState<NotificationItem[]>([]); // TODO: Fetch from API

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Navigate to search results or filter current page
    if (query.trim() && pathname?.includes("/transactions")) {
      // If on transactions page, the search is handled by the page component
      // This is just for global search functionality
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Navigate to transactions page with search query
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <nav className="w-full h-[75px] border-b border-[#1A1A1A] px-4 md:px-10">
        <div className="h-full flex items-center justify-between gap-4 flex-wrap">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search here..."
            value={searchQuery}
            onChange={handleSearch}
            onKeyPress={handleKeyPress}
            className="bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md w-full sm:w-1/3 md:w-[400px] placeholder:text-[#E5E5E5] outline-none focus-within:ring-1"
          />

          {/* Icons and Avatar */}
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Popover>
              <PopoverTrigger asChild>
                <div className="p-2 rounded-md relative cursor-pointer">
                  <Bell className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
                  <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2.5 h-2.5 bg-[#EB6945] rounded-full" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="end">
                <NotificationPanel notifications={notifications} />
              </PopoverContent>
            </Popover>

            <div 
              className="p-2 rounded-md cursor-pointer"
              onClick={() => router.push("/settings/preferences")}
            >
              <Settings className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
            </div>

            <div 
              className="p-2 rounded-md cursor-pointer"
              onClick={() => router.push("/help/support")}
            >
              <HelpCircle className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
            </div>

            {/* Wallet (replaces avatar) */}
            <div className="relative">
              <ConnectWalletButton variant="avatar" />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
