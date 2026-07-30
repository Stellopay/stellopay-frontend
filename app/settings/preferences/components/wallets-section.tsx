"use client";

import React, { useState } from "react";
import { Trash2, Wallet as WalletIcon } from "lucide-react";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface WalletItem {
  id: string;
  nickname: string;
  address: string;
}

interface WalletsSectionProps {
  wallets?: WalletItem[];
  onRemoveWallet?: (id: string) => void;
  /** When set, scrolls to and highlights the matching control. */
  highlightedSearchLabel?: string | null;
}

const DEFAULT_WALLETS: WalletItem[] = [
  {
    id: "w1",
    nickname: "Primary Treasury",
    address: "GAYO...3X92",
  },
  {
    id: "w2",
    nickname: "Secondary Operations",
    address: "GCBK...991A",
  },
];

export function WalletsSection({
  wallets = DEFAULT_WALLETS,
  onRemoveWallet,
  highlightedSearchLabel,
}: WalletsSectionProps) {
  useSearchHighlight(highlightedSearchLabel ?? null);
  const [walletList, setWalletList] = useState<WalletItem[]>(wallets);
  const [walletToRemove, setWalletToRemove] = useState<WalletItem | null>(null);

  const handleConfirmRemove = () => {
    if (!walletToRemove) return;
    const targetId = walletToRemove.id;
    setWalletList((prev) => prev.filter((w) => w.id !== targetId));
    if (onRemoveWallet) {
      onRemoveWallet(targetId);
    }
    setWalletToRemove(null);
  };

  return (
    <section className="space-y-4 rounded-lg border p-4 bg-background text-foreground">
      <div data-search-label="Connected wallets">
        <h3 className="text-lg font-medium">Connected Wallets</h3>
        <p className="text-sm text-muted-foreground">
          Manage your connected wallets for payroll and payments.
        </p>
      </div>

      {walletList.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No connected wallets found.</p>
      ) : (
        <ul className="divide-y rounded-md border" role="list">
          {walletList.map((wallet) => (
            <li
              key={wallet.id}
              data-search-label="Remove primary wallet"
              className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center space-x-3">
                <WalletIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium leading-none">{wallet.nickname}</p>
                  <p className="text-xs text-muted-foreground mt-1">{wallet.address}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWalletToRemove(wallet)}
                aria-label={`Remove ${wallet.nickname} (${wallet.address})`}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* WCAG 2.1 AA Accessible Remove Confirmation Dialog */}
      <Dialog open={!!walletToRemove} onOpenChange={(open) => !open && setWalletToRemove(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Connected Wallet</DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to disconnect{" "}
              <span className="font-semibold text-foreground">
                {walletToRemove?.nickname}
              </span>{" "}
              ({walletToRemove?.address})? This action cannot be undone and you will need to re-verify to re-add it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWalletToRemove(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemove}
            >
              Remove Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default WalletsSection;
