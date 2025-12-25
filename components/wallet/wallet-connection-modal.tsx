"use client";

import { useWallet } from "@/context/wallet-context";
import ConnectWalletButton from "./connect-wallet-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet } from "lucide-react";

export default function WalletConnectionModal() {
  const { address, isVerified, isConnecting, isVerifying, isInitializing } = useWallet();

  // Show modal only if:
  // 1. Not initializing (wait for initial check to complete)
  // 2. Wallet is not connected or not verified
  const isOpen = !isInitializing && (!address || !isVerified);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-[#1a0c1d] border-[#2E2E2E] text-white max-w-md"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
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
            {isConnecting
              ? "Connecting to your wallet..."
              : isVerifying
                ? "Verifying your wallet with the backend..."
                : "Please connect your wallet to access the dashboard and manage your transactions."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-col items-center gap-4">
          <ConnectWalletButton
            variant="button"
            className="w-full bg-white text-black hover:bg-white/90 px-6 py-3 rounded-lg font-medium transition-colors"
            onConnected={() => {
              // Modal will close automatically when wallet is connected
            }}
          />
          <p className="text-xs text-[#9CA3AF] text-center">
            By connecting, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

