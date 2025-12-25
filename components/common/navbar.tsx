// components/Navbar.tsx
import { Bell, Settings, HelpCircle } from "lucide-react";
import ConnectWalletButton from "@/components/wallet/connect-wallet-button";

export default function Navbar() {
  return (
    <>
      <nav className="w-full h-[75px] border-b border-[#1A1A1A] px-4 md:px-10">
        <div className="h-full flex items-center justify-between gap-4 flex-wrap">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search here..."
            className="bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md w-full sm:w-1/3 md:w-[400px] placeholder:text-[#E5E5E5] outline-none focus-within:ring-1"
          />

          {/* Icons and Avatar */}
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <div className="p-2 rounded-md relative">
              <Bell className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
              <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2.5 h-2.5 bg-[#EB6945] rounded-full" />
            </div>

            <div className="p-2 rounded-md">
              <Settings className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] hover:text-[#FFFFFF] transition-colors" />
            </div>

            <div className="p-2 rounded-md">
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
