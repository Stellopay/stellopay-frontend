"use client";

/**
 * WatchlistPanel
 *
 * Lets users pin counterparty addresses or token assets for quick
 * reference on the dashboard. Pinned items persist per-account via
 * WalletContext (localStorage under `stellopay.watchlist.<address>`).
 *
 * Accessibility: WCAG 2.1 AA — all interactive elements are keyboard
 * reachable, labelled, and have visible focus rings.
 * Dark mode: follows the project's `dark:` Tailwind class convention.
 * Responsive: single column on sm, two columns from md upward.
 */

import React, { useCallback, useId, useState } from "react";
import {
  Pin,
  PinOff,
  Star,
  AlertCircle,
  Clock,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { useWatchlist } from "@/context/wallet-context";
import type { WatchlistItem } from "@/types/watchlist";

// ─── Token icon map ──────────────────────────────────────────────────────────

const TOKEN_ICONS: Record<string, string> = {
  USDC: "/usd.png",
  XLM: "/stellar.png",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

interface WatchlistItemCardProps {
  item: WatchlistItem;
  onUnpin: (id: string) => void;
}

function WatchlistItemCard({ item, onUnpin }: WatchlistItemCardProps) {
  const statusColorMap: Record<string, string> = {
    success:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    destructive:
      "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  const amountColor =
    item.lastAmount !== undefined
      ? item.lastAmount >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400"
      : "text-zinc-500 dark:text-zinc-400";

  const tokenIcon = item.token ? TOKEN_ICONS[item.token] : undefined;

  return (
    <article
      data-testid={`watchlist-item-${item.id}`}
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border p-4 transition-all",
        "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/50",
        "hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700",
      )}
      aria-label={`Watchlist item: ${item.label || item.address}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Token icon or generic star */}
          {tokenIcon ? (
            <div
              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1.5 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <img
                src={tokenIcon}
                alt={`${item.token} icon`}
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Star
                className="w-4 h-4 text-blue-500 dark:text-blue-400"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Label / address */}
          <div className="min-w-0">
            {item.label && (
              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate leading-tight">
                {item.label}
              </p>
            )}
            <p
              className={cn(
                "font-mono text-xs truncate",
                item.label
                  ? "text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-700 dark:text-zinc-300 font-semibold",
              )}
            >
              {item.address}
            </p>
          </div>
        </div>

        {/* Unpin button */}
        <button
          type="button"
          onClick={() => onUnpin(item.id)}
          aria-label={`Unpin ${item.label || item.address}`}
          title="Remove from watchlist"
          className={cn(
            "shrink-0 p-1.5 rounded-lg transition-colors",
            "text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400",
            "hover:bg-rose-50 dark:hover:bg-rose-900/20",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
          )}
        >
          <PinOff className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Balance or last amount */}
        {item.balance !== undefined ? (
          <div>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
              Balance
            </p>
            <p className="text-base font-bold text-zinc-900 dark:text-white">
              {item.balance}
            </p>
          </div>
        ) : item.lastAmount !== undefined ? (
          <div>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
              Last Tx
            </p>
            <p className={cn("text-base font-bold", amountColor)}>
              {item.lastAmount >= 0
                ? `+$${item.lastAmount.toFixed(2)}`
                : `-$${Math.abs(item.lastAmount).toFixed(2)}`}
            </p>
          </div>
        ) : null}

        {/* Last activity + status */}
        <div className="flex flex-col items-end gap-1">
          {item.lastActivity && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <time dateTime={item.lastActivity}>{item.lastActivity}</time>
            </div>
          )}
          {item.lastStatus && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                statusColorMap[item.lastStatusColor ?? "success"] ??
                  statusColorMap["success"],
              )}
            >
              {item.lastStatus}
            </span>
          )}
        </div>
      </div>

      {/* Token badge */}
      {item.token && (
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            {item.token}
          </span>
        </div>
      )}
    </article>
  );
}

// ─── Add-item form ────────────────────────────────────────────────────────────

interface AddItemFormProps {
  onAdd: (address: string, label?: string) => void;
  onCancel: () => void;
}

function AddItemForm({ onAdd, onCancel }: AddItemFormProps) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addressId = useId();
  const labelId = useId();
  const errorId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Address is required.");
      return;
    }
    if (trimmed.length < 8) {
      setError("Enter a valid address (at least 8 characters).");
      return;
    }
    onAdd(trimmed, label.trim() || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="form"
      aria-label="Add item to watchlist"
      className="space-y-3 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 p-4"
      noValidate
    >
      <div className="space-y-2">
        <label
          htmlFor={addressId}
          className="block text-xs font-bold text-zinc-700 dark:text-zinc-300"
        >
          Address or Asset <span aria-hidden="true">*</span>
        </label>
        <input
          id={addressId}
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError(null);
          }}
          placeholder="G… address or token symbol"
          required
          aria-required="true"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full rounded-xl border px-3 py-2 text-sm font-mono transition-colors",
            "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            error
              ? "border-rose-400 dark:border-rose-600"
              : "border-zinc-200 dark:border-zinc-700",
          )}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={labelId}
          className="block text-xs font-bold text-zinc-700 dark:text-zinc-300"
        >
          Label{" "}
          <span className="font-normal text-zinc-400 dark:text-zinc-500">
            (optional)
          </span>
        </label>
        <input
          id={labelId}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Payroll Account"
          maxLength={40}
          className={cn(
            "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm transition-colors",
            "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors",
            "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
            "hover:bg-zinc-200 dark:hover:bg-zinc-700",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={cn(
            "px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors",
            "bg-blue-600 dark:bg-blue-500 text-white",
            "hover:bg-blue-700 dark:hover:bg-blue-400",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          Pin
        </button>
      </div>
    </form>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function WatchlistEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      data-testid="watchlist-empty"
      className="flex flex-col items-center justify-center gap-3 py-10 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Pin
          className="w-5 h-5 text-zinc-400 dark:text-zinc-500"
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          No pinned items yet
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[220px]">
          Pin counterparty addresses or assets for quick reference.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "mt-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
          "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
          "hover:opacity-90",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600",
        )}
      >
        Pin your first item
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface WatchlistPanelProps {
  /** Override for testing / Storybook */
  className?: string;
}

export function WatchlistPanel({ className }: WatchlistPanelProps) {
  const { items, isLoading, addItem, removeItem } = useWatchlist();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const headingId = useId();
  const searchId = useId();

  const handleAdd = useCallback(
    (address: string, label?: string) => {
      addItem(address, label);
      setShowAddForm(false);
      setSearchQuery("");
    },
    [addItem],
  );

  const handleUnpin = useCallback(
    (id: string) => {
      removeItem(id);
    },
    [removeItem],
  );

  const filteredItems = searchQuery.trim()
    ? items.filter(
        (item) =>
          item.address
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase()) ||
          item.label
            ?.toLowerCase()
            .includes(searchQuery.trim().toLowerCase()) ||
          item.token
            ?.toLowerCase()
            .includes(searchQuery.trim().toLowerCase()),
      )
    : items;

  return (
    <section
      aria-labelledby={headingId}
      data-testid="watchlist-panel"
      className={cn(
        "rounded-2xl border transition-all",
        "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 shadow-sm",
        "p-6",
        className,
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2
            id={headingId}
            className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"
          >
            <Pin
              className="w-5 h-5 text-blue-500 dark:text-blue-400"
              aria-hidden="true"
            />
            Watchlist
          </h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Pinned counterparties &amp; assets
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          aria-expanded={showAddForm}
          aria-label={showAddForm ? "Cancel adding to watchlist" : "Pin new item"}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors shrink-0 self-start sm:self-auto",
            showAddForm
              ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              : "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900",
            "hover:opacity-90",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4" aria-hidden="true" />
              Cancel
            </>
          ) : (
            <>
              <Pin className="w-4 h-4" aria-hidden="true" />
              Pin Item
            </>
          )}
        </button>
      </div>

      {/* ── Add-item form ──────────────────────────────────────────────── */}
      {showAddForm && (
        <div className="mb-6">
          <AddItemForm
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* ── Loading state ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div
          role="status"
          aria-label="Loading watchlist"
          aria-busy="true"
          aria-live="polite"
          data-testid="watchlist-loading"
          className="flex flex-col gap-3"
        >
          <span className="sr-only">Loading watchlist items…</span>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : items.length === 0 && !showAddForm ? (
        /* ── Empty state ─────────────────────────────────────────────── */
        <WatchlistEmpty onAdd={() => setShowAddForm(true)} />
      ) : (
        /* ── Content ──────────────────────────────────────────────────── */
        <>
          {/* Search — only shown when there are items */}
          {items.length > 0 && (
            <div className="relative mb-4">
              <label htmlFor={searchId} className="sr-only">
                Search watchlist
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id={searchId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by address, label, or token…"
                aria-label="Search watchlist"
                className={cn(
                  "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 pl-9 pr-3 py-2 text-sm transition-colors",
                  "bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white",
                  "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Watchlist grid */}
          {filteredItems.length === 0 ? (
            <div
              data-testid="watchlist-no-results"
              className="py-8 text-center"
            >
              <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                No items match &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <ul
              aria-label={`${filteredItems.length} pinned item${filteredItems.length === 1 ? "" : "s"}`}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <WatchlistItemCard item={item} onUnpin={handleUnpin} />
                </li>
              ))}
            </ul>
          )}

          {/* Loader when background refresh occurs while items are visible */}
          {isLoading && (
            <div
              aria-live="polite"
              className="flex items-center justify-center gap-2 pt-4 text-xs text-zinc-400 dark:text-zinc-500"
            >
              <Loader2
                className="w-3 h-3 animate-spin"
                aria-hidden="true"
              />
              Refreshing…
            </div>
          )}
        </>
      )}
    </section>
  );
}
