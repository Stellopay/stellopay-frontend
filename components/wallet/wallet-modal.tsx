"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Wallet, WalletModalProps } from "@/types/wallet";
import { Network, useNetwork } from "@/context/network-context";

const ALL_WALLETS: Wallet[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "/logos/MetaMask.svg",
    supportedNetworks: ["ethereum", "polygon", "arbitrum", "optimism"],
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "braavos",
    name: "Braavos",
    icon: "/logos/braavos.jpeg",
    supportedNetworks: ["starknet"],
    installUrl: "https://braavos.app/",
  },
  {
    id: "argentx",
    name: "Argent X",
    icon: "/logos/argent-x.png",
    supportedNetworks: ["starknet"],
    installUrl: "https://www.argent.xyz/argent-x/",
  },
  {
    id: "trustwallet",
    name: "Trust Wallet",
    icon: "/logos/trust-wallet.svg",
    supportedNetworks: ["ethereum", "polygon"],
    installUrl: "https://trustwallet.com/",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "/logos/coinbase.png",
    supportedNetworks: ["ethereum", "polygon", "arbitrum"],
    installUrl: "https://www.coinbase.com/wallet",
  },

  {
    id: "lobstr",
    name: "Lobstr",
    icon: "/logos/lobstr.png",
    supportedNetworks: ["stellar"],
    installUrl: "https://lobstr.co/",
  },
];

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const { selectedNetwork } = useNetwork();
  const [filteredWallets, setFilteredWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    if (selectedNetwork && selectedNetwork !== "all") {
      const compatibleWallets = ALL_WALLETS.filter((wallet) =>
        wallet.supportedNetworks.includes(selectedNetwork),
      );
      setFilteredWallets(compatibleWallets);
    } else {
      setFilteredWallets(ALL_WALLETS);
    }
  }, [selectedNetwork]);

  const handleConnect = (wallet: Wallet) => {
    onConnect(wallet);
    onClose();
  };

  const handleInstall = (wallet: Wallet) => {
    if (wallet.installUrl) {
      window.open(wallet.installUrl, "_blank");
    }
  };

  const isWalletInstalled = (wallet: Wallet) => {
    switch (wallet.id) {
      case "metamask":
        return (
          !!(window as any).ethereum && (window as any).ethereum.isMetaMask
        );
      case "coinbase":
        return (
          !!(window as any).ethereum &&
          (window as any).ethereum.isCoinbaseWallet
        );
      case "trustwallet":
        return (
          !!(window as any).ethereum &&
          !(window as any).ethereum.isMetaMask &&
          !(window as any).ethereum.isCoinbaseWallet
        );
      case "braavos":
        return !!(window as any).starknet_braavos;
      case "argentx":
        return !!(window as any).starknet_argentX;
      case "lobstr":
        return !!(window as any).lobstr;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Connect a Wallet
          </DialogTitle>
          <p className="text-center text-gray-400 text-sm">
            {selectedNetwork && selectedNetwork !== "all"
              ? `Showing wallets compatible with ${selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)}`
              : "Showing all available wallets"}
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {filteredWallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                No wallets available for the selected network.
              </p>
            </div>
          ) : (
            filteredWallets.map((wallet) => {
              const installed = isWalletInstalled(wallet);
              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Image
                        src={wallet.icon}
                        alt={wallet.name}
                        width={24}
                        height={24}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-xs text-gray-400">
                        {installed ? "Installed" : "Not installed"}
                      </p>
                    </div>
                  </div>

                  {installed ? (
                    <Button
                      onClick={() => handleConnect(wallet)}
                      className="bg-[#598EFF] hover:bg-[#4a7eff] text-white"
                      size="sm"
                    >
                      Connect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleInstall(wallet)}
                      variant="outline"
                      className="border-[#598EFF] text-[#598EFF] hover:bg-[#598EFF] hover:text-white"
                      size="sm"
                    >
                      Install
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
