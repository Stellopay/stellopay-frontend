"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormFieldInput } from "@/components/ui/form-field";
import ToggleCard from "@/components/common/toggle-card";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_WALLETS } from "@/lib/demo-data";
import { useWallet, formatAddress } from "@/context/wallet-context";
import { stellarAddressSchema } from "@/utils/stellarAddress";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";
import { Check, Copy, Loader2, Plus } from "lucide-react";

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

interface StatusState {
  message: string;
  type: "success" | "error" | null;
}

/**
 * WalletsSection component.
 *
 * Reads connected wallet state from {@link useWallet}. When a wallet is
 * connected the live address (truncated) and active network are shown.
 * When disconnected the component falls back to {@link DEMO_WALLETS} behind
 * an explicit "Demo Data" badge.
 *
 * The danger-zone remove action routes through {@link WalletContextValue.disconnect}
 * so all consumers (navbar, dashboard, etc.) see the change immediately.
 *
 * Security: only truncated public G-addresses are rendered; secret keys are
 * never accepted or displayed.
 */
export default function WalletsSection() {
  const { address, isConnected, network, disconnect } = useWallet();

  const [settings, setSettings] = useState<WalletSettingsState>({
    transferApprovals: true,
    addressBookLock: true,
    travelRuleChecks: true,
  });
  const [status, setStatus] = useState<StatusState>({ message: "", type: null });
  const [isSaving, setIsSaving] = useState(false);
  const [addedWallets, setAddedWallets] = useState<string[]>([]);

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
    setStatus({ message: "", type: null });
    try {
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          if (Math.random() > 0.8) reject(new Error("Failed to save"));
          else resolve(null);
        }, 1500),
      );
      setStatus({
        message:
          "Wallet safeguards updated. Transfer review controls remain enabled by default.",
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

  /** Route the destructive remove action through the context. */
  const handleRemoveWallet = () => {
    disconnect();
    setStatus({
      message:
        "Wallet removal request captured. A replacement wallet should be selected before execution.",
      type: "success",
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white flex flex-wrap items-center gap-2">
            Connected wallets
            {!isConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20">
                Demo Data
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Wallet identity and transfer controls stay on the same surface so
            users do not lose context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {isConnected ? (
            // Live wallet card — sourced from WalletProvider context.
            // Address is truncated; the full key is never rendered.
            <div
              data-testid="live-wallet-card"
              className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    Primary Treasury
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {network.name}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-transparent dark:text-zinc-400"
                >
                  Default settlement wallet
                </Badge>
              </div>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Address: {formatAddress(address)}
              </p>
            </div>
          ) : (
            // Fallback — demo wallets shown only when no wallet is connected.
            DEMO_WALLETS.map((wallet) => (
              <div
                key={wallet.name}
                data-testid="demo-wallet-card"
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
            ))
          )}

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
              Add wallet
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Only validated Stellar public addresses (G… or muxed M…) are
              accepted. Secret keys are rejected before anything is stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAddWallet)}
                className="space-y-4"
                noValidate
              >
                <FormFieldInput
                  control={form.control}
                  name="address"
                  label="Wallet address"
                  placeholder="G… or M…"
                  autoComplete="off"
                  required
                />
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleAddWallet)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add wallet
                </Button>
              </form>
            </Form>
            {addedWallets.length > 0 && (
              <ul className="space-y-2" data-testid="added-wallets">
                {addedWallets.map((addr) => (
                  <AddedWalletRow key={addr} address={addr} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

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
              onConfirm={handleRemoveWallet}
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

/**
 * Renders a validated wallet address with a truncated, copy-to-clipboard
 * affordance. Only the truncated form is shown; the full address is copied on
 * demand and never rendered in full.
 */
function AddedWalletRow({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const truncated = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <li
      data-testid="added-wallet"
      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5"
    >
      <span
        title="Validated Stellar address"
        className="font-mono text-sm text-zinc-700 dark:text-zinc-300"
      >
        {truncated}
      </span>
      <button
        type="button"
        onClick={() => copyToClipboardWithTimeout(address, setCopied, 1500)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus:outline-none"
        aria-label="Copy wallet address"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-success" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy
          </>
        )}
      </button>
    </li>
  );
}
