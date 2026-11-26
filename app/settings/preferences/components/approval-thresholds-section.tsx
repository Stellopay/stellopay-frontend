"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getApprovalThresholds,
  removeApprovalThreshold,
  setApprovalThreshold,
} from "@/lib/approvals-store";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";

export default function ApprovalThresholdsSection({
  highlightedSearchLabel,
}: {
  highlightedSearchLabel?: string | null;
}) {
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useSearchHighlight(highlightedSearchLabel ?? null);

  useEffect(() => {
    try {
      setThresholds(getApprovalThresholds());
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Approval thresholds could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveThreshold = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAsset = asset.trim().toUpperCase();
    const amountMinorUnits = Number(amount);
    if (!/^[A-Z0-9._-]{2,12}$/.test(normalizedAsset)) {
      setError(
        "Enter an asset code using 2–12 letters, numbers, dots, underscores, or hyphens.",
      );
      return;
    }
    if (!Number.isSafeInteger(amountMinorUnits) || amountMinorUnits <= 0) {
      setError("Threshold must be a positive whole number of minor units.");
      return;
    }

    try {
      setApprovalThreshold(normalizedAsset, amountMinorUnits);
      setThresholds(getApprovalThresholds());
      setAsset("");
      setAmount("");
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Approval threshold could not be saved.",
      );
    }
  };

  const deleteThreshold = (assetCode: string) => {
    try {
      removeApprovalThreshold(assetCode);
      setThresholds(getApprovalThresholds());
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Approval threshold could not be removed.",
      );
    }
  };

  return (
    <section
      className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      aria-labelledby="approval-thresholds-title"
    >
      <header className="mb-6">
        <h2 id="approval-thresholds-title" className="text-xl font-semibold">
          Payment approval thresholds
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Payments must exceed the asset threshold to enter the approval queue.
          Amounts are positive integer minor units; comparisons use integer
          values. Removing a threshold disables approval checks for that asset.
        </p>
      </header>

      {error && (
        <p className="mb-4 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <p role="status" className="text-sm text-zinc-500">
          Loading thresholds…
        </p>
      ) : (
        <>
          <ul
            aria-label="Configured approval thresholds"
            className="mb-6 divide-y divide-zinc-200 dark:divide-white/10"
          >
            {Object.entries(thresholds)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([assetCode, amountMinorUnits]) => (
                <li
                  key={assetCode}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <p className="text-sm">
                    <span className="font-semibold">{assetCode}</span>
                    <span className="ml-2 text-zinc-500">
                      {amountMinorUnits.toLocaleString()} minor units
                    </span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => deleteThreshold(assetCode)}
                    aria-label={`Remove ${assetCode} threshold`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            {Object.keys(thresholds).length === 0 && (
              <li className="py-3 text-sm text-zinc-500">
                No payment approval thresholds configured.
              </li>
            )}
          </ul>

          <form
            data-search-label="Approval threshold"
            className="grid gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-white/5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={saveThreshold}
          >
            <label className="grid gap-1 text-sm font-medium">
              Asset code
              <Input
                value={asset}
                onChange={(event) => setAsset(event.target.value)}
                placeholder="USDC"
                maxLength={12}
                autoComplete="off"
                aria-describedby="threshold-asset-help"
              />
              <span
                id="threshold-asset-help"
                className="text-xs font-normal text-zinc-500"
              >
                Uppercase symbol, for example USDC or XLM.
              </span>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Threshold (minor units)
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="10000"
              />
            </label>
            <Button type="submit">Save threshold</Button>
          </form>
        </>
      )}
    </section>
  );
}
