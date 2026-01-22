"use client";

import { useWallet } from "@/context/wallet-context";
import { WalletModal } from "./wallet-modal";
import { Wallet as WalletType } from "@/types/wallet";
import { useNetwork } from "@/context/network-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { useState } from "react";

export default function WalletConnectionModal() {
  const { connectedWallet, connectWallet } = useWallet();
  const { selectedNetwork } = useNetwork();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const isOpen = !connectedWallet && !isWalletModalOpen;

  const handleWalletSuccess = (wallet: WalletType, walletAddress: string) => {
    connectWallet(wallet, walletAddress, selectedNetwork || "ethereum");
    setIsWalletModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#1a0c1d] border-[#2E2E2E] text-white max-w-md z-40">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#2E2E2E] flex items-center justify-center">
                <Wallet className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center text-white">
              Connect Your Wallet
            </DialogTitle>
            <DialogDescription className="text-center text-[#9CA3AF] mt-2">
              Please connect your wallet to access the dashboard and manage your
              transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="w-full bg-white text-black hover:bg-white/90 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Connect Wallet
            </button>
            <p className="text-xs text-[#9CA3AF] text-center">
              By connecting, you agree to our terms of service and privacy
              policy.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletSuccess}
      />
    </>
  );
}
