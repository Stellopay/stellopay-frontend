"use client";

import React, { useCallback, useMemo } from "react";
import { LogOut, Wallet as WalletIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/context/wallet-context";

type ConnectWalletButtonProps = {
  className?: string;
  /**
   * How the trigger should look when connected.
   * - button: shows truncated address in the button
   * - avatar: shows a common circular wallet icon (for dashboard top-right)
   */
  variant?: "button" | "avatar";
  /**
   * Called after a successful connection (useful for closing mobile menus).
   */
  onConnected?: () => void;
};

function formatAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function ConnectWalletButton({
  className,
  variant = "button",
  onConnected,
}: ConnectWalletButtonProps) {
  const { address, isConnecting, error, connectWallet, disconnectWallet } =
    useWallet();

  const label = useMemo(() => {
    if (isConnecting) return "Connecting…";
    if (address) return formatAddress(address);
    return "Connect Wallet";
  }, [address, isConnecting]);

  const handleConnect = useCallback(async () => {
    await connectWallet();
    onConnected?.();
  }, [connectWallet, onConnected]);

  const handleDisconnect = useCallback(async () => {
    await disconnectWallet();
  }, [disconnectWallet]);

  const trigger = useMemo(() => {
    if (variant === "avatar") {
      const baseClassName =
        className ??
        "h-10 rounded-full border border-[#242428] bg-[#101010] flex items-center gap-2 px-3 text-sm text-[#EEF4FF] hover:bg-[#141414] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

      // Dashboard navbar behavior:
      // - Disconnected: show "Connect Wallet" CTA
      // - Connected: show wallet icon + truncated address (menu trigger)
      if (!address) {
        return (
          <button
            type="button"
            disabled={isConnecting}
            aria-busy={isConnecting}
            className={baseClassName}
            onClick={() => void handleConnect()}
            aria-label="Connect wallet"
          >
            <WalletIcon className="w-5 h-5 text-[#EEF4FF]" />
            <span>{label}</span>
          </button>
        );
      }

      return (
        <button
          type="button"
          disabled={isConnecting}
          aria-busy={isConnecting}
          className={baseClassName}
          aria-label="Wallet menu"
        >
          <WalletIcon className="w-5 h-5 text-[#EEF4FF]" />
          <span>{formatAddress(address)}</span>
        </button>
      );
    }

    // variant === "button"
    return (
      <button
        type="button"
        disabled={isConnecting}
        aria-busy={isConnecting}
        onClick={!address ? () => void handleConnect() : undefined}
        className={className}
      >
        {label}
      </button>
    );
  }, [address, className, handleConnect, isConnecting, label, variant]);

  if (!address) {
    return (
      <div className="flex flex-col gap-2">
        {trigger}
        {error ? (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void handleDisconnect();
            }}
            variant="destructive"
          >
            <LogOut />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}


