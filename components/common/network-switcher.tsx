"use client";

/**
 * NetworkSwitcher
 *
 * Lets the user switch between Stellar networks (Mainnet, Testnet,
 * Futurenet). Each network in {@link SUPPORTED_NETWORKS} carries its public
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
 *
 * Improvements over the original (issue #343):
 * - Confirmation dialog is associated with its title via `aria-labelledby`
 *   and with its descriptive body via `aria-describedby` so screen-reader
 *   users hear the full context when the dialog opens.
 * - Target network name is wrapped in `<strong>` for semantic emphasis.
 * - Focus returns to the DropdownMenuTrigger when the dialog closes
 *   (either Cancel or Escape).
 */

import React, { useRef, useState } from "react";
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

  /**
   * Ref to the DropdownMenuTrigger button so focus can be explicitly returned
   * to it when the confirmation dialog closes (issue #343).
   * We attach this to a wrapper <div> because the shadcn DropdownMenuTrigger
   * wrapper does not forward refs; the wrapping element is used only for
   * focus-return measurement — the actual trigger button is queried inside it.
   */
  const triggerWrapperRef = useRef<HTMLDivElement>(null);

  /**
   * Returns focus to the DropdownMenuTrigger button after the dialog closes.
   * Called from `onCloseAutoFocus` on DialogContent (issue #343).
   */
  const returnFocusToTrigger = (e: Event) => {
    e.preventDefault(); // suppress Radix's default focus-return
    const btn = triggerWrapperRef.current?.querySelector<HTMLElement>('[data-slot="dropdown-menu-trigger"]');
    btn?.focus();
  };

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
    // Focus returns to the trigger via onCloseAutoFocus on DialogContent
    // (issue #343).
  };

  /**
   * Cancels the pending switch. Focus returns to the dropdown trigger via
   * the `onCloseAutoFocus` handler on DialogContent (issue #343).
   */
  const cancelSwitch = () => {
    setPendingNetwork(null);
  };

  if (isLoading) {
    return <Skeleton className={cn("h-9 w-24 rounded-md", className)} />;
  }

  return (
    <>
      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      {/* ref wrapper lets us locate the trigger button for focus-return (issue #343) */}
      <div ref={triggerWrapperRef} style={{ display: "contents" }}>
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
      </div>{/* /triggerWrapperRef */}

      {/* ── Confirmation dialog ───────────────────────────────────────── */}
      {/*
       * aria-labelledby points to the DialogTitle so screen readers announce
       * "Switch network?" as the dialog name when it opens (issue #343).
       *
       * aria-describedby points to the DialogDescription so the full warning
       * text — including the target network name — is read after the title.
       *
       * Radix Dialog sets role="dialog" and manages focus automatically;
       * focus moves to the first focusable element (Cancel) when it opens.
       * onCloseAutoFocus returns focus to the DropdownMenuTrigger button so
       * keyboard users land back on the control they originally activated.
       */}
      <Dialog open={!!pendingNetwork} onOpenChange={(open) => { if (!open) cancelSwitch(); }}>
        <DialogContent
          className="bg-[#1A1A1A] border-[#242428] text-white max-w-sm"
          showCloseButton={false}
          aria-labelledby="network-switcher-dialog-title"
          aria-describedby="network-switcher-dialog-desc"
          onCloseAutoFocus={returnFocusToTrigger}
        >
          <DialogHeader>
            <DialogTitle
              id="network-switcher-dialog-title"
              className="text-white"
            >
              Switch network?
            </DialogTitle>
            <DialogDescription
              id="network-switcher-dialog-desc"
              className="text-[#9CA3AF]"
            >
              You are switching from{" "}
              <strong className="font-semibold text-white">{currentNetwork.name}</strong>{" "}
              to{" "}
              <strong className="font-semibold text-white">{pendingNetwork?.name}</strong>.
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
