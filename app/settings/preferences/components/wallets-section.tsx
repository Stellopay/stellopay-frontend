"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ToggleCard from "@/components/common/toggle-card";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_WALLETS } from "@/lib/demo-data";
import { Loader2 } from "lucide-react";
import { stellarAddressSchema } from "@/utils/stellarAddress";

interface ConnectedWallet {
  name: string;
  network: string;
  address: string;
  status: string;
}

interface WalletSettingsState {
  transferApprovals: boolean;
  addressBookLock: boolean;
  travelRuleChecks: boolean;
}

interface StatusState {
  message: string;
  type: "success" | "error" | null;
}

/**
 * WalletsSection component.
 * Renders connected wallet configurations, region settings, and outbound transfer safeguards.
 * Uses placeholder demo data pending full backend API integration.
 */
export default function WalletsSection() {
  const [settings, setSettings] = useState<WalletSettingsState>({
    transferApprovals: true,
    addressBookLock: true,
    travelRuleChecks: true,
  });
  const [status, setStatus] = useState<StatusState>({ message: "", type: null });
  const [isSaving, setIsSaving] = useState(false);
  const [connectedWallets, setConnectedWallets] =
    useState<ConnectedWallet[]>(() => [...DEMO_WALLETS]);
  const [walletName, setWalletName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletAddressError, setWalletAddressError] = useState("");

  const updateSetting = (field: keyof WalletSettingsState, value: boolean) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus({ message: "", type: null });
    try {
      await new Promise((resolve, reject) => setTimeout(() => {
        if (Math.random() > 0.8) {
          reject(new Error("Failed to save"));
        } else {
          resolve(null);
        }
      }, 1500));
      setStatus({
        message: "Wallet safeguards updated. Transfer review controls remain enabled by default.",
        type: "success",
      });
    } catch {
      setStatus({
        message: "Failed to save changes. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus({ message: "", type: null }), 5000);
    }
  };

  const handleAddWallet = () => {
    setWalletAddressError("");

    try {
      const result = stellarAddressSchema.safeParse(walletAddress);

      if (!result.success) {
        setWalletAddressError(
          result.error.issues[0]?.message ?? "Enter a valid Stellar public address.",
        );
        return;
      }

      const normalizedAddress = result.data;
      const isDuplicate = connectedWallets.some(
        (wallet) => wallet.address.toUpperCase() === normalizedAddress,
      );

      if (isDuplicate) {
        setWalletAddressError("This Stellar address is already connected.");
        return;
      }

      setConnectedWallets((currentWallets) => [
        ...currentWallets,
        {
          name: walletName.trim() || "New Stellar wallet",
          network: normalizedAddress.startsWith("M") ? "Stellar Muxed" : "Stellar",
          address: normalizedAddress,
          status: "Pending review",
        },
      ]);
      setWalletName("");
      setWalletAddress("");
      setStatus({
        message: "Wallet address added for review.",
        type: "success",
      });
    } catch {
      setWalletAddressError("Enter a valid Stellar public address.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white flex flex-wrap items-center gap-2">
            Connected wallets
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20">
              Demo Data
            </span>
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Wallet identity and transfer controls stay on the same surface so
            users do not lose context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_auto] md:items-end">
              <div className="space-y-2">
                <label
                  htmlFor="wallet-name"
                  className="text-sm font-medium text-zinc-900 dark:text-white"
                >
                  Wallet label
                </label>
                <input
                  id="wallet-name"
                  value={walletName}
                  onChange={(event) => setWalletName(event.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
                  placeholder="Payroll wallet"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="wallet-address"
                  className="text-sm font-medium text-zinc-900 dark:text-white"
                >
                  Stellar address
                </label>
                <input
                  id="wallet-address"
                  value={walletAddress}
                  onChange={(event) => {
                    setWalletAddress(event.target.value);
                    setWalletAddressError("");
                  }}
                  aria-invalid={walletAddressError ? "true" : undefined}
                  aria-describedby={walletAddressError ? "wallet-address-error" : undefined}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
                  placeholder="G... or M..."
                />
                {walletAddressError && (
                  <p
                    id="wallet-address-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {walletAddressError}
                  </p>
                )}
              </div>

              <Button type="button" onClick={handleAddWallet}>
                Add wallet
              </Button>
            </div>
          </div>

          {connectedWallets.map((wallet) => (
            <div
              key={wallet.name}
              className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {wallet.name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {wallet.network}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-transparent dark:text-zinc-400"
                >
                  {wallet.status}
                </Badge>
              </div>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Address: {wallet.address}
              </p>
            </div>
          ))}

          <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show wallet metadata and compliance checks
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MetadataItem label="Settlement region" value="Nigeria and UK" />
              <MetadataItem
                label="Compliance mode"
                value="Travel rule checks on"
              />
              <MetadataItem label="Default asset" value="USDC" />
              <MetadataItem label="Address book lock" value="Enabled" />
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
              Outbound safeguards
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Controls that change transfer behavior stay separate from wallet
              identity details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <ToggleCard
              title="Approval required for new recipients"
              description="Force review before first transfer to any new wallet address."
              badge="Recommended"
              enabled={settings.transferApprovals}
              onToggle={(value) => updateSetting("transferApprovals", value)}
            />
            <ToggleCard
              title="Lock approved address book"
              description="Prevent edits to trusted addresses without extra verification."
              enabled={settings.addressBookLock}
              onToggle={(value) => updateSetting("addressBookLock", value)}
            />
            <ToggleCard
              title="Travel rule checks"
              description="Validate counterparty information before eligible transfers leave the platform."
              enabled={settings.travelRuleChecks}
              onToggle={(value) => updateSetting("travelRuleChecks", value)}
            />
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save wallet settings"
              )}
            </Button>
            {status.message && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-2xl border px-4 py-3 ${
                  status.type === "success"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-destructive/20 bg-destructive/10"
                }`}
              >
                <p
                  className={`text-sm ${
                    status.type === "success"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-destructive"
                  }`}
                >
                  {status.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
              onConfirm={() =>
                setStatus({
                  message: "Wallet removal request captured. A replacement wallet should be selected before execution.",
                  type: "success",
                })
              }
            />
          </CardContent>
        </Card>
      </div>
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
