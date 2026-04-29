"use client";

/**
 * NetworkSwitcher
 *
 * Improvements over the original (issue #238):
 * - Active-network badge: green dot + "Active" label on the current network
 * - Confirmation dialog: shown before committing a switch, warns that
 *   balances and transaction history will reflect the new network
 * - Keyboard accessibility: Radix DropdownMenu already handles arrow-key
 *   navigation; trigger now has an explicit aria-label describing the
 *   current network so screen readers announce it correctly
 * - No secrets or private keys are ever displayed
 */

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { Skeleton } from "@/components/ui/skeleton";

export interface Network {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

interface NetworkSwitcherProps {
  networks?: Network[];
  selectedNetwork?: Network;
  onNetworkChange?: (network: Network) => void;
  className?: string;
  variant?: "dashboard" | "landing";
  isLoading?: boolean;
}

const defaultNetworks: Network[] = [
  { id: "eth", name: "ETH" },
  { id: "polygon", name: "Polygon" },
  { id: "bsc", name: "BSC" },
  { id: "arbitrum", name: "Arbitrum" },
];

/** Minimal Ethereum diamond icon — no external asset dependency */
const EthereumIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 0L5.5 12.5L12 16L18.5 12.5L12 0Z" fill="currentColor" />
    <path d="M12 17.5L5.5 13.5L12 24L18.5 13.5L12 17.5Z" fill="currentColor" />
  </svg>
);

export default function NetworkSwitcher({
  networks = defaultNetworks,
  selectedNetwork = defaultNetworks[0],
  onNetworkChange,
  className,
  variant = "dashboard",
  isLoading = false,
}: NetworkSwitcherProps) {
  const [currentNetwork, setCurrentNetwork] = useState<Network>(selectedNetwork);
  /** The network the user clicked but hasn't confirmed yet */
  const [pendingNetwork, setPendingNetwork] = useState<Network | null>(null);

  const isDashboard = variant === "dashboard";

  /** Called when the user clicks a network in the dropdown */
  const handleNetworkSelect = (network: Network) => {
    if (network.id === currentNetwork.id) return; // already active — no-op
    setPendingNetwork(network);
  };

  /** Called when the user confirms the switch in the dialog */
  const confirmSwitch = () => {
    if (!pendingNetwork) return;
    setCurrentNetwork(pendingNetwork);
    onNetworkChange?.(pendingNetwork);
    setPendingNetwork(null);
  };

  const cancelSwitch = () => setPendingNetwork(null);

  if (isLoading) {
    return <Skeleton className={cn("h-9 w-24 rounded-md", className)} />;
  }

  return (
    <>
      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Current network: ${currentNetwork.name}. Click to switch network.`}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors outline-none focus:ring-1 focus:ring-offset-1",
            isDashboard
              ? "bg-transparent border-[#242428] text-white hover:bg-[#1A1A1A] focus:ring-[#598EFF]"
              : "bg-transparent border-[#598EFF]/30 text-white hover:bg-[#598EFF]/10 focus:ring-[#598EFF]",
            className,
          )}
        >
          {/* Active-network indicator dot */}
          <span
            className="w-2 h-2 rounded-full bg-green-500 shrink-0"
            aria-hidden="true"
          />
          {currentNetwork.icon || <EthereumIcon />}
          <span className="text-sm font-medium" style={{ fontFamily: "General Sans, sans-serif" }}>
            {currentNetwork.name}
          </span>
          <ChevronDown className="w-4 h-4 text-[#6e6d6e]" aria-hidden="true" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn(
            "min-w-[160px] border-[#242428] text-white",
            isDashboard ? "bg-[#1A1A1A]" : "bg-[#0a0a0a]",
          )}
          align="end"
          sideOffset={8}
          aria-label="Available networks"
        >
          {networks.map((network) => {
            const isActive = currentNetwork.id === network.id;
            return (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "cursor-pointer text-white",
                  isDashboard
                    ? "focus:bg-[#242428] focus:text-white"
                    : "focus:bg-[#1A1A1A] focus:text-white",
                  isActive && (isDashboard ? "bg-[#242428]" : "bg-[#1A1A1A]"),
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  {network.icon || <EthereumIcon />}
                  <span className="text-sm" style={{ fontFamily: "General Sans, sans-serif" }}>
                    {network.name}
                  </span>
                  {/* Active badge */}
                  {isActive && (
                    <span className="ml-auto flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-green-500"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-green-400 font-medium">Active</span>
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Confirmation dialog ───────────────────────────────────────── */}
      <Dialog open={!!pendingNetwork} onOpenChange={(open) => { if (!open) cancelSwitch(); }}>
        <DialogContent
          className="bg-[#1A1A1A] border-[#242428] text-white max-w-sm"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Switch network?</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              You are switching from{" "}
              <span className="font-semibold text-white">{currentNetwork.name}</span>{" "}
              to{" "}
              <span className="font-semibold text-white">{pendingNetwork?.name}</span>.
              <br />
              <br />
              Your displayed balances and transaction history will reflect the
              new network. No funds will be moved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={cancelSwitch}
              className="text-[#9CA3AF] hover:text-white hover:bg-[#242428]"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSwitch}
              className="bg-[#598EFF] text-white hover:bg-[#4A7CE8]"
              data-testid="confirm-network-switch"
            >
              Switch to {pendingNetwork?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
