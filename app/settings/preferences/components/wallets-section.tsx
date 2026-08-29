"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Trash2, Wallet as WalletIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { truncateStellarAddress } from "@/utils/stellarAddress";

export interface WalletItem {
  id: string;
  nickname: string;
  address: string;
}

interface WalletsSectionProps {
  wallets?: WalletItem[];
  onRemoveWallet?: (id: string) => void;
  onUpdateNickname?: (id: string, nickname: string) => void;
}

const MAX_NICKNAME_LENGTH = 40;

const DEFAULT_WALLETS: WalletItem[] = [
  { id: "w1", nickname: "Primary Treasury", address: "GAYO...3X92" },
  { id: "w2", nickname: "Secondary Operations", address: "GCBK...991A" },
];

export function WalletsSection({
  wallets = DEFAULT_WALLETS,
  onRemoveWallet,
  onUpdateNickname,
}: WalletsSectionProps) {
  useSearchHighlight(highlightedSearchLabel ?? null);
  const [walletList, setWalletList] = useState<WalletItem[]>(wallets);
  const [walletToRemove, setWalletToRemove] = useState<WalletItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const isDirty =
    editingId !== null &&
    editingValue.trim() !==
      (walletList.find((w) => w.id === editingId)?.nickname ?? "").trim();

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(
      "You have unsaved changes. Are you sure you want to leave?",
    );
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (
      ...args: Parameters<typeof originalPushState>
    ) {
      if (!confirmDiscardChanges()) {
        return;
      }
      originalPushState.apply(this, args);
    };

    window.history.replaceState = function (
      ...args: Parameters<typeof originalReplaceState>
    ) {
      if (!confirmDiscardChanges()) {
        return;
      }
      originalReplaceState.apply(this, args);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [isDirty, confirmDiscardChanges]);

  const startEditing = (wallet: WalletItem) => {
    if (!confirmDiscardChanges()) return;
    setEditingId(wallet.id);
    setEditingValue(wallet.nickname);
  };

  const commitEdit = (id: string) => {
    const trimmed = editingValue.trim();
    const fallback = truncateStellarAddress(
      walletList.find((w) => w.id === id)?.address ?? "",
    );
    const next = trimmed || fallback;

    setWalletList((prev) =>
      prev.map((w) => (w.id === id ? { ...w, nickname: next } : w)),
    );
    onUpdateNickname?.(id, next);
    setEditingId(null);
  };

  const cancelEdit = () => {
    if (!confirmDiscardChanges()) return;
    setEditingId(null);
    setEditingValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") commitEdit(id);
    if (e.key === "Escape") cancelEdit();
  };

  const handleConfirmRemove = () => {
    if (!walletToRemove) return;
    const { id } = walletToRemove;
    if (editingId === id) {
      if (!confirmDiscardChanges()) return;
      setEditingId(null);
      setEditingValue("");
    }
    setWalletList((prev) => prev.filter((w) => w.id !== id));
    onRemoveWallet?.(id);
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
          {walletList.map((wallet) => {
            const isEditing = editingId === wallet.id;
            const displayName = wallet.nickname || truncateStellarAddress(wallet.address);

            return (
              <li
                key={wallet.id}
                className="flex items-center justify-between gap-2 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <WalletIcon
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, wallet.id)}
                          maxLength={MAX_NICKNAME_LENGTH}
                          aria-label={`Nickname for wallet ${wallet.address}`}
                          className="h-7 text-sm"
                        />
                        {/* onMouseDown prevents the input's blur from firing before onClick */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => commitEdit(wallet.id)}
                          aria-label="Save nickname"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={cancelEdit}
                          aria-label="Cancel editing"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(wallet)}
                        className="group flex items-center gap-1.5 text-left"
                        aria-label={`Edit nickname for ${displayName}`}
                      >
                        <span className="text-sm font-medium leading-none">{displayName}</span>
                        <Pencil
                          className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {wallet.address}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWalletToRemove(wallet)}
                  aria-label={`Remove ${displayName} (${wallet.address})`}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* WCAG 2.1 AA – Remove Confirmation Dialog */}
      <Dialog open={!!walletToRemove} onOpenChange={(open) => !open && setWalletToRemove(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Connected Wallet</DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to disconnect{" "}
              <span className="font-semibold text-foreground">
                {walletToRemove?.nickname ||
                  truncateStellarAddress(walletToRemove?.address ?? "")}
              </span>{" "}
              ({walletToRemove?.address})? This action cannot be undone and you will need to
              re-verify to re-add it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setWalletToRemove(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmRemove}>
              Remove Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default WalletsSection;
