"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Star, Plus, Trash2, Clock3, Wallet, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWallet, formatAddress } from "@/context/wallet-context";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
} from "@/utils/watchlist";
import { EmptyState } from "@/components/ui/empty-state";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatActivityTime(timestamp?: string): string {
  if (!timestamp) return "No activity yet";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  const h24 = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} • ${h12}:${minutes} ${period}`;
}

function itemIcon(item: WatchlistItem): LucideIcon {
  return item.type === "asset" ? Coins : Wallet;
}

function itemTypeLabel(item: WatchlistItem): string {
  return item.type === "asset" ? "Asset" : "Counterparty";
}

function itemDisplayLabel(item: WatchlistItem): string {
  if (item.type === "asset") return item.label;
  // Counterparty addresses are long; show a short form when the label is the
  // raw G-address.
  if (item.label.startsWith("G") && item.label.length > 9) {
    return formatAddress(item.label);
  }
  return item.label;
}

interface WatchlistPanelProps {
  /** Optional override of the storage scope for tests. Defaults to useWallet(). */
  addressOverride?: string | null;
}

/**
 * Watchlist panel for the dashboard. Lets users pin counterparties and
 * assets so their latest activity is visible at a glance. Persists the
 * pinned list per-account via localStorage (see utils/watchlist.ts).
 */
export function WatchlistPanel({ addressOverride }: WatchlistPanelProps) {
  const wallet = useWallet();
  const address = addressOverride !== undefined ? addressOverride : wallet.address;

  const [items, setItems] = useState<WatchlistItem[]>(() =>
    getWatchlist(address),
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"counterparty" | "asset">("counterparty");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when the wallet account changes.
  useEffect(() => {
    setItems(getWatchlist(address));
  }, [address]);

  // Focus the add-form input when the form opens (WCAG focus management).
  useEffect(() => {
    if (showAddForm) inputRef.current?.focus();
  }, [showAddForm]);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  const handleAdd = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmedLabel = label.trim();
      if (!trimmedLabel) return;

      const id = trimmedLabel;
      const next = addToWatchlist(address, {
        id,
        type,
        label: trimmedLabel,
        pinnedAt: new Date().toISOString(),
      });
      setItems(next);
      setLabel("");
      setShowAddForm(false);
      announce(
        `${type === "asset" ? "Asset" : "Counterparty"} ${trimmedLabel} added to watchlist`,
      );
    },
    [address, label, type, announce],
  );

  const handleRemove = useCallback(
    (id: string, removedLabel: string) => {
      const next = removeFromWatchlist(address, id);
      setItems(next);
      announce(`${removedLabel} removed from watchlist`);
    },
    [address, announce],
  );

  const displayItems = useMemo(() => items, [items]);

  return (
    <section
      aria-labelledby="watchlist-heading"
      className="w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-elevation-1 transition-colors dark:border-zinc-800 dark:bg-[#111111] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800/70">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <Star className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="watchlist-heading"
              className="text-xl font-bold text-zinc-900 dark:text-white"
            >
              Watchlist
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Pin counterparties and assets you transact with often to see
              their latest activity at a glance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          aria-expanded={showAddForm}
          aria-controls="watchlist-add-form"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#111111]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {showAddForm ? "Cancel" : "Add to watchlist"}
        </button>
      </div>

      {announcement && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
      )}

      {showAddForm && (
        <form
          id="watchlist-add-form"
          onSubmit={handleAdd}
          className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="watchlist-label"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Address or asset code
              </label>
              <input
                ref={inputRef}
                id="watchlist-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={
                  type === "asset"
                    ? "e.g. USDC, XLM"
                    : "e.g. GABC...XYZ"
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-700 dark:bg-[#1A1A1A] dark:text-white dark:focus-visible:ring-white"
              />
            </div>

            <fieldset className="flex-1">
              <legend className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Type
              </legend>
              <div className="flex gap-2" role="radiogroup">
                {(["counterparty", "asset"] as const).map((option) => (
                  <label
                    key={option}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      type === option
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-[#1A1A1A] dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="watchlist-type"
                      value={option}
                      checked={type === option}
                      onChange={() => setType(option)}
                      className="sr-only"
                    />
                    {option === "asset" ? "Asset" : "Counterparty"}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={!label.trim()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#111111]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Pin
            </button>
          </div>
        </form>
      )}

      <div className="pt-5">
        {displayItems.length === 0 ? (
          <EmptyState
            title="No pinned items"
            description="Add counterparties or assets to your watchlist to track their latest activity."
          />
        ) : (
          <ul
            role="list"
            aria-label={`${displayItems.length} pinned watchlist items`}
            className="divide-y divide-zinc-100 dark:divide-zinc-800/70"
          >
            {displayItems.map((item) => {
              const Icon = itemIcon(item);
              return (
                <li
                  key={item.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      item.type === "asset"
                        ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                        : "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-words text-sm font-semibold text-zinc-900 dark:text-white">
                        {itemDisplayLabel(item)}
                      </span>
                      <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {itemTypeLabel(item)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.balance && (
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {item.balance}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        {formatActivityTime(item.lastActivity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id, itemDisplayLabel(item))}
                    aria-label={`Remove ${itemDisplayLabel(item)} from watchlist`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 dark:focus-visible:ring-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default WatchlistPanel;