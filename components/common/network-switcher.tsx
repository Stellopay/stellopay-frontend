"use client";

/**
 * NetworkSwitcher
 *
 * Lets the user switch between Stellar networks (Mainnet, Testnet,
 * Futurenet). Each network in {@link defaultNetworks} carries its public
 * passphrase so callers can map the selection to the correct Horizon/RPC
 * endpoint.
 *
 * - Active-network badge: green dot + "Active" label on the current network
 * - Confirmation dialog: shown before committing a switch, warns that
 *   balances and Stellar operations will reflect the new network
 * - Keyboard accessibility: Radix DropdownMenu already handles arrow-key
 *   navigation; trigger now has an explicit aria-label describing the
 *   current network so screen readers announce it correctly
 * - No secrets or private keys are ever displayed — only public network
 *   passphrases
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
import { StellarIcon } from "@/public/svg/svg";

/**
 * A Stellar network the user can switch the app to.
 */
export interface Network {
  /** Stable identifier, e.g. "public", "testnet", "futurenet" */
  id: string;
  /** Human-readable label shown in the switcher, e.g. "Mainnet" */
  name: string;
  /**
   * Stellar network passphrase used to sign transactions and select the
   * correct Horizon/RPC endpoint for this network. Only public, well-known
   * passphrases belong here — never a secret key or seed.
   */
  passphrase?: string;
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

/**
 * Default Stellar networks offered by the switcher, ordered with the
 * production network first so it is selected by default.
 */
const defaultNetworks: Network[] = [
  {
    id: "public",
    name: "Mainnet",
    passphrase: "Public Global Stellar Network ; September 2015",
  },
  {
    id: "testnet",
    name: "Testnet",
    passphrase: "Test SDF Network ; September 2015",
  },
  {
    id: "futurenet",
    name: "Futurenet",
    passphrase: "Test SDF Future Network ; October 2022",
  },
];

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
          {currentNetwork.icon || <StellarIcon />}
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
                  {network.icon || <StellarIcon />}
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
              Your displayed balances and Stellar operations will reflect the
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
