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
import { SUPPORTED_NETWORKS, useWallet } from "@/context/wallet-context";
import type { Network } from "@/types/wallet";

export type { Network };

interface NetworkSwitcherProps {
  // Optional overrides. When omitted, the component reads the active network
  // and the network list from WalletProvider, which is the source of truth.
  // The props are kept so existing call sites and tests that pass networks
  // explicitly continue to work without modification.
  networks?: Network[];
  selectedNetwork?: Network;
  onNetworkChange?: (network: Network) => void;
  className?: string;
  variant?: "dashboard" | "landing";
  isLoading?: boolean;
}

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

const NETWORK_DIALOG_TITLE_ID = "network-switcher-dialog-title";
const NETWORK_DIALOG_DESCRIPTION_ID = "network-switcher-dialog-description";

export default function NetworkSwitcher({
  networks,
  selectedNetwork,
  onNetworkChange,
  className,
  variant = "dashboard",
  isLoading = false,
}: NetworkSwitcherProps) {
  const wallet = useWallet();

  // Props win over context so callers that want to pin a network for a
  // specific surface still can. When neither is provided, the wallet
  // context drives both the list and the selection.
  const resolvedNetworks: Network[] = networks ?? SUPPORTED_NETWORKS;
  const currentNetwork: Network = selectedNetwork ?? wallet.network;

  // The network the user clicked but has not confirmed yet. Local state by
  // design: the pending choice should not be observable to the rest of the
  // app until the user confirms.
  const [pendingNetwork, setPendingNetwork] = useState<Network | null>(null);

  const isDashboard = variant === "dashboard";

  const handleNetworkSelect = (network: Network) => {
    if (network.id === currentNetwork.id) return;
    setPendingNetwork(network);
  };

  const confirmSwitch = () => {
    if (!pendingNetwork) return;
    // Only commit to the shared context when there is no caller override.
    // When selectedNetwork is provided, the parent is treating this as a
    // controlled component and is responsible for the source of truth.
    if (!selectedNetwork) {
      wallet.setNetwork(pendingNetwork);
    }
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
          <span
            className="text-sm font-medium"
            style={{ fontFamily: "General Sans, sans-serif" }}
          >
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
          {resolvedNetworks.map((network) => {
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
                  <span
                    className="text-sm"
                    style={{ fontFamily: "General Sans, sans-serif" }}
                  >
                    {network.name}
                  </span>
                  {/* Active badge */}
                  {isActive && (
                    <span className="ml-auto flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-green-500"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-green-400 font-medium">
                        Active
                      </span>
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Confirmation dialog ───────────────────────────────────────── */}
      <Dialog
        open={!!pendingNetwork}
        onOpenChange={(open) => {
          if (!open) cancelSwitch();
        }}
      >
        <DialogContent
          aria-labelledby={NETWORK_DIALOG_TITLE_ID}
          aria-describedby={NETWORK_DIALOG_DESCRIPTION_ID}
          className="bg-[#1A1A1A] border-[#242428] text-white max-w-sm"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle id={NETWORK_DIALOG_TITLE_ID} className="text-white">
              Switch network?
            </DialogTitle>
            <DialogDescription
              id={NETWORK_DIALOG_DESCRIPTION_ID}
              className="text-[#9CA3AF]"
            >
              You are switching from{" "}
              <span
                className="font-semibold text-white"
                data-testid="network-switch-current-network"
              >
                {currentNetwork.name}
              </span>{" "}
              to{" "}
              <span
                className="font-semibold text-white"
                data-testid="network-switch-target-network"
              >
                {pendingNetwork?.name}
              </span>
              .
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
