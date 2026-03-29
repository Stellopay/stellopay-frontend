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

const connectedWallets = [
  {
    name: "Primary Treasury",
    network: "Stellar Mainnet",
    address: "GBSL...4KQ2",
    status: "Default settlement wallet",
  },
  {
    name: "Operations Wallet",
    network: "Starknet",
    address: "0x47f...12ce",
    status: "Approvals required for outbound transfers",
  },
];

interface WalletSettingsState {
  transferApprovals: boolean;
  addressBookLock: boolean;
  travelRuleChecks: boolean;
}

export default function WalletsSection() {
  const [settings, setSettings] = useState<WalletSettingsState>({
    transferApprovals: true,
    addressBookLock: true,
    travelRuleChecks: true,
  });
  const [statusMessage, setStatusMessage] = useState("");

  const updateSetting = (field: keyof WalletSettingsState, value: boolean) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
            Connected wallets
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Wallet identity and transfer controls stay on the same surface so
            users do not lose context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
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
            <Button
              onClick={() =>
                setStatusMessage(
                  "Wallet safeguards updated. Transfer review controls remain enabled by default.",
                )
              }
            >
              Save wallet settings
            </Button>
            {statusMessage ? (
              <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                {statusMessage}
              </p>
            ) : null}
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
                setStatusMessage(
                  "Wallet removal request captured. A replacement wallet should be selected before execution.",
                )
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
