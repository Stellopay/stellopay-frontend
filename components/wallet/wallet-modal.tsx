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
import { ethers } from "ethers";

const ALL_WALLETS: Wallet[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "/logos/MetaMask.svg",
    supportedNetworks: ["ethereum"],
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
    supportedNetworks: ["ethereum"],
    installUrl: "https://trustwallet.com/",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "/logos/coinbase.png",
    supportedNetworks: ["ethereum"],
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

export function WalletModal({ isOpen, onClose, onSuccess }: WalletModalProps) {
  const { selectedNetwork } = useNetwork();
  const [filteredWallets, setFilteredWallets] = useState<Wallet[]>([]);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

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

  const getEthereumProvider = (walletId: string) => {
    const win = window as any;

    console.log("Getting provider for:", walletId);
    console.log("window.ethereum exists:", !!win.ethereum);
    console.log("window.ethereum.providers:", win.ethereum?.providers);

    // Handle multiple providers
    if (Array.isArray(win.ethereum?.providers)) {
      console.log("Multiple providers detected");
      const provider = win.ethereum.providers.find((p: any) => {
        console.log("Checking provider:", {
          isMetaMask: p.isMetaMask,
          isCoinbaseWallet: p.isCoinbaseWallet,
          isTrust: p.isTrust,
        });

        switch (walletId) {
          case "metamask":
            return p.isMetaMask && !p.isCoinbaseWallet;
          case "coinbase":
            return p.isCoinbaseWallet;
          case "trustwallet":
            return p.isTrust;
          default:
            return false;
        }
      });

      if (provider) {
        console.log("Found provider in providers array");
        return provider;
      }
    }

    // Handle single provider or specific wallet instances
    console.log("Checking single provider");
    console.log("ethereum.isMetaMask:", win.ethereum?.isMetaMask);
    console.log("ethereum.isCoinbaseWallet:", win.ethereum?.isCoinbaseWallet);

    switch (walletId) {
      case "metamask":
        if (win.ethereum?.isMetaMask && !win.ethereum?.isCoinbaseWallet) {
          console.log("Found MetaMask as single provider");
          return win.ethereum;
        }
        break;
      case "coinbase":
        if (win.coinbaseWalletExtension) return win.coinbaseWalletExtension;
        if (win.ethereum?.isCoinbaseWallet) return win.ethereum;
        break;
      case "trustwallet":
        if (win.trustwallet) return win.trustwallet;
        if (win.ethereum?.isTrust) return win.ethereum;
        break;
    }

    console.log("No provider found for", walletId);
    return null;
  };

  const handleConnect = async (wallet: Wallet) => {
    setConnectingWallet(wallet.id);
    try {
      if (wallet.supportedNetworks.includes("starknet")) {
        let starknetWallet: any = null;

        if (wallet.id === "braavos" && (window as any).starknet_braavos) {
          starknetWallet = (window as any).starknet_braavos;
        } else if (
          wallet.id === "argentx" &&
          (window as any).starknet_argentX
        ) {
          starknetWallet = (window as any).starknet_argentX;
        }

        if (starknetWallet) {
          try {
            await starknetWallet.enable();
            if (starknetWallet.isConnected && starknetWallet.selectedAddress) {
              const address = starknetWallet.selectedAddress;
              onSuccess?.(wallet, address);
              onClose();
            } else {
              console.log(
                "Failed to connect to Starknet wallet - not connected",
              );
              alert(
                `Failed to connect to ${wallet.name}. Please unlock the wallet and try again.`,
              );
            }
          } catch (error) {
            console.log("Error connecting to Starknet wallet:", error);
            alert(`Failed to connect to ${wallet.name}. Please try again.`);
          }
        } else {
          console.log(
            `Starknet wallet ${wallet.name} not found. Please install the wallet extension.`,
          );
          alert(`Please install ${wallet.name} wallet extension to connect.`);
        }
      } else if (
        wallet.supportedNetworks.some((net) => ["ethereum"].includes(net))
      ) {
        const walletProvider = getEthereumProvider(wallet.id);

        console.log("Wallet provider found:", !!walletProvider);

        if (walletProvider) {
          try {
            const provider = new ethers.BrowserProvider(walletProvider);
            const accounts = await provider.send("eth_requestAccounts", []);

            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            console.log(
              "Connected to Ethereum wallet:",
              wallet.name,
              "Address:",
              address,
            );
            onSuccess?.(wallet, address);
            onClose();
          } catch (error: any) {
            console.error(`Failed to connect to ${wallet.name}:`, error);
            console.error("Error details:", {
              message: error.message,
              code: error.code,
              data: error.data,
            });
          }
        } else {
          console.error(`No provider found for ${wallet.name}`);
          alert(
            `Could not find ${wallet.name}. Please make sure it's installed and unlocked.`,
          );
        }
      } else {
        console.log("Unsupported network for wallet:", wallet.name);
        alert("This wallet is not supported for the current network");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setConnectingWallet(null);
    }
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
          !!(window as any).coinbaseWalletExtension ||
          (!!(window as any).ethereum &&
            (window as any).ethereum.isCoinbaseWallet) ||
          (Array.isArray((window as any).ethereum?.providers) &&
            (window as any).ethereum.providers.some(
              (p: any) => p.isCoinbaseWallet,
            ))
        );
      case "trustwallet":
        return (
          !!(window as any).trustwallet ||
          (!!(window as any).ethereum && (window as any).ethereum.isTrust) ||
          (Array.isArray((window as any).ethereum?.providers) &&
            (window as any).ethereum.providers.some((p: any) => p.isTrust))
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
                      disabled={connectingWallet === wallet.id}
                      className="bg-[#598EFF] hover:bg-[#4a7eff] text-white disabled:opacity-50"
                      size="sm"
                    >
                      {connectingWallet === wallet.id
                        ? "Connecting..."
                        : "Connect"}
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
