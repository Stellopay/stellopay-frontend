// components/Navbar.tsx
"use client";

import { useState } from "react";
import { Bell, Settings, HelpCircle, Wallet } from "lucide-react";
import { NetworkSwitcher } from "./network-switcher";
import { WalletModal } from "@/components/wallet/wallet-modal";
import { Button } from "@/components/ui/button";
import { Wallet as WalletType } from "@/types/wallet";
import { useWallet } from "@/context/wallet-context";
import { useNetwork } from "@/context/network-context";
import { formatAddress } from "@/utils/formatUtils";

export default function Navbar() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { connectedWallet, connectWallet, disconnectWallet } = useWallet();
  const { selectedNetwork } = useNetwork();

  const handleWalletSuccess = (wallet: WalletType, address: string) => {
    connectWallet(wallet, address, selectedNetwork || "ethereum");
  };

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

            <NetworkSwitcher />
            {connectedWallet ? (
              <div className="flex items-center gap-2">
                <div className="bg-[#0D0D0D] px-3 py-2 rounded-lg flex items-center gap-2">
                  <img
                    src={connectedWallet.wallet.icon}
                    className="w-5 h-5"
                    alt=""
                  />
                  <span className="text-white font-medium text-sm">
                    {formatAddress(connectedWallet.address)}
                  </span>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  className="text-xs px-2 py-1 h-8"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-[#0D0D0D] cursor-pointer text-white flex items-center gap-2"
              >
                <img src="/wallet.svg" className="w-5 h-5" alt="" />
                <span className="hidden sm:inline font-medium text-sm">
                  Connect Wallet
                </span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletSuccess}
      />
    </>
  );
}
