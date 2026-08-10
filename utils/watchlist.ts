/**
 * Watchlist storage helpers — persists pinned counterparties and assets
 * per-account via localStorage, following the same SSR-safe pattern as
 * context/wallet-context.tsx.
 *
 * Storage key format: stellopay.watchlist.<walletAddress>
 * Data: JSON array of WatchlistItem
 */

export interface WatchlistItem {
  /** Stellar G-address or asset code. */
  id: string;
  /**
   * "counterparty" for a Stellar public address,
   * "asset" for a token symbol/code.
   */
  type: "counterparty" | "asset";
  /** Human-readable label displayed in the UI. */
  label: string;
  /** ISO-8601 timestamp of when the item was pinned. */
  pinnedAt: string;
  /** ISO-8601 timestamp of the latest known activity, if available. */
  lastActivity?: string;
  /** Latest known balance string (e.g. "1,250.50 XLM"). */
  balance?: string;
}

const STORAGE_PREFIX = "stellopay.watchlist";

function getStorageKey(address: string | null): string {
  // Use a stable fallback key when no wallet is connected.
  return `${STORAGE_PREFIX}.${address ?? "anonymous"}`;
}

/**
 * SSR-safe, read-errors-swallowed localStorage read.
 */
function readFromStorage(key: string): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as WatchlistItem[];
  } catch {
    return [];
  }
}

/**
 * SSR-safe, write-errors-swallowed localStorage write.
 */
function writeToStorage(key: string, items: WatchlistItem[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the current watchlist for the given wallet address.
 * Falls back to the anonymous key when address is null.
 */
export function getWatchlist(address: string | null): WatchlistItem[] {
  return readFromStorage(getStorageKey(address));
}

/**
 * Adds an item to the watchlist. Silently no-ops if the id already exists.
 * Returns the updated list.
 */
export function addToWatchlist(
  address: string | null,
  item: WatchlistItem,
): WatchlistItem[] {
  const key = getStorageKey(address);
  const current = readFromStorage(key);
  if (current.some((i) => i.id === item.id)) return current;
  const updated = [...current, item];
  writeToStorage(key, updated);
  return updated;
}

/**
 * Removes an item from the watchlist by id. Returns the updated list.
 */
export function removeFromWatchlist(
  address: string | null,
  id: string,
): WatchlistItem[] {
  const key = getStorageKey(address);
  const current = readFromStorage(key);
  const updated = current.filter((i) => i.id !== id);
  writeToStorage(key, updated);
  return updated;
}

/**
 * Updates an existing watchlist item's fields (e.g. balance, lastActivity).
 * Returns the updated list, or the current list if the id is not found.
 */
export function updateWatchlistItem(
  address: string | null,
  id: string,
  partial: Partial<Pick<WatchlistItem, "balance" | "lastActivity" | "label">>,
): WatchlistItem[] {
  const key = getStorageKey(address);
  const current = readFromStorage(key);
  const updated = current.map((i) =>
    i.id === id ? { ...i, ...partial } : i,
  );
  writeToStorage(key, updated);
  return updated;
}