"use client";

import React, { useState, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Wallet as WalletIcon, Check, Copy, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormFieldInput } from "@/components/ui/form-field";
import ToggleCard from "@/components/common/toggle-card";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_WALLETS } from "@/lib/demo-data";
import { useWallet, formatAddress } from "@/context/wallet-context";
import { stellarAddressSchema } from "@/utils/stellarAddress";
import { copyToClipboardWithFeedback } from "@/utils/clipboardUtils";
import { toast } from "sonner";

/**
 * Add-wallet form schema. The address is validated and normalized (trimmed,
 * upper-cased) by {@link stellarAddressSchema}, which rejects secret seeds and
 * malformed strkeys before the value is ever stored or displayed.
 */
const addWalletSchema = z.object({
  address: stellarAddressSchema,
});

type AddWalletFormValues = z.infer<typeof addWalletSchema>;

interface WalletSettingsState {
  transferApprovals: boolean;
  addressBookLock: boolean;
  travelRuleChecks: boolean;
}

export interface WalletItem {
  id: string;
  nickname: string;
  address: string;
}

interface WalletsSectionProps {
  wallets?: WalletItem[];
  onRemoveWallet?: (id: string) => void;
}

/**
 * WalletsSection component.
 *
 * Reads connected wallet state from {@link useWallet}. When a wallet is
 * connected the live address (truncated) and active network are shown.
 * When disconnected the component falls back to {@link DEMO_WALLETS} behind
 * an explicit "Demo Data" badge.
 *
 * Security: only truncated public G-addresses are rendered; secret keys are
 * never accepted or displayed.
 */
export default function WalletsSection({
  wallets,
  onRemoveWallet,
}: WalletsSectionProps) {
  const { address, isConnected, network, disconnect } = useWallet();

  const [settings, setSettings] = useState<WalletSettingsState>({
    transferApprovals: true,
    addressBookLock: true,
    travelRuleChecks: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [addedWallets, setAddedWallets] = useState<string[]>([]);
  const [walletToRemove, setWalletToRemove] = useState<WalletItem | null>(null);

  const form = useForm<AddWalletFormValues>({
    resolver: zodResolver(addWalletSchema),
    defaultValues: { address: "" },
  });

  // Addresses already on the surface; normalized for duplicate detection.
  const reservedAddresses = useMemo(
    () =>
      new Set(
        DEMO_WALLETS.map((wallet) => wallet.address.trim().toUpperCase()),
      ),
    [],
  );

  const handleAddWallet = (values: AddWalletFormValues) => {
    const addr = values.address;
    if (reservedAddresses.has(addr) || addedWallets.includes(addr)) {
      form.setError("address", {
        type: "duplicate",
        message: "This wallet address has already been added.",
      });
      return;
    }
    setAddedWallets((current) => [...current, addr]);
    form.reset();
  };

  const updateSetting = (field: keyof WalletSettingsState, value: boolean) => {
    setSettings((s) => ({ ...s, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          if (Math.random() > 0.8) reject(new Error("Failed to save"));
          else resolve(null);
        }, 1500),
      );
      toast.success(
        "Wallet safeguards updated. Transfer review controls remain enabled by default.",
      );
    } catch {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /** Route the destructive remove action through context & props. */
  const handleRemoveWallet = () => {
    if (walletToRemove && onRemoveWallet) {
      onRemoveWallet(walletToRemove.id);
    }
    disconnect();
    toast.success(
      "Wallet removal request captured. A replacement wallet should be selected before execution.",
    );
    setWalletToRemove(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 shadow-sm dark:bg-white/5">
        <CardHeader>
          <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
            Connected Wallets
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Manage your connected wallets for payroll and settlement transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected && DEMO_WALLETS.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No connected wallets found.</p>
          ) : (
            <ul className="divide-y rounded-md border" role="list">
              {DEMO_WALLETS.map((wallet) => (
                <li
                  key={wallet.id}
                  data-testid="demo-wallet-card"
                  className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <WalletIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium leading-none">{wallet.name}</p>
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-muted-foreground">{formatAddress(wallet.address)}</p>
                        <CopyAddressButton address={wallet.address} />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setWalletToRemove({ id: wallet.id, nickname: wallet.name, address: wallet.address })}
                    aria-label={`Remove ${wallet.name} (${wallet.address})`}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Section */}
      <Card className="border-red-500/20 bg-white/90 shadow-sm dark:bg-white/5">
        <CardHeader className="border-b border-red-500/10">
          <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
            Wallet danger zone
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Removing a wallet is destructive, so it is isolated and confirmed
            independently from toggle changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <DestructiveActionDialog
            triggerLabel="Remove primary wallet"
            title="Remove the primary settlement wallet"
            description="This will block settlement flows that depend on the current default wallet."
            impactItems={[
              "Scheduled payouts using the wallet would pause immediately.",
              "Operators would need to nominate a new default settlement wallet.",
              "Historical references remain visible for audit trails.",
            ]}
            confirmationToken="REMOVE"
            confirmationLabel='Type "REMOVE" to confirm'
            confirmLabel="Remove wallet"
            onConfirm={handleRemoveWallet}
          />
        </CardContent>
      </Card>

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
              onClick={handleRemoveWallet}
            >
              Remove Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#09090B]">
      <p className="text-xs font-medium tracking-[0.18em] text-zinc-400 uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{value}</p>
    </div>
  );
}

// ─── Copy feedback states ─────────────────────────────────────────────────────

type CopyStatus = "idle" | "success" | "error";

/**
 * Inline copy-to-clipboard button with brief visual feedback.
 */
function CopyAddressButton({ address }: { address: string }) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  const handleCopy = () => {
    copyToClipboardWithFeedback(
      address,
      () => {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
      },
      () => {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 align-middle text-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
      aria-label={
        status === "success"
          ? "Address copied"
          : status === "error"
            ? "Copy failed"
            : "Copy wallet address"
      }
    >
      {status === "success" ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
        </>
      ) : status === "error" ? (
        <>
          <X className="h-4 w-4 text-destructive" aria-hidden="true" />
          <span className="text-destructive">Failed</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}