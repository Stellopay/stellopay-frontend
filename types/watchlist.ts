/**
 * Data shape for a single item pinned to the watchlist.
 *
 * An item can represent either a counterparty address (when `address` is a
 * Stellar G-address) or a tracked asset (when `token` is set).
 */
export interface WatchlistItem {
  /** Stable unique identifier — generated on pin (e.g. crypto.randomUUID). */
  id: string;
  /**
   * The Stellar G-address or placeholder address for the pinned counterparty.
   * For a plain asset watch (no counterparty) this holds the token symbol or
   * a synthetic key like "USDC:issuer".
   */
  address: string;
  /** Optional human-readable label, e.g. "Payroll Account". */
  label?: string;
  /** Token symbol associated with the item, e.g. "XLM" or "USDC". */
  token?: string;
  /**
   * Latest known balance string, formatted for display, e.g. "$1,234.56".
   * Populated from the most recent API/hook fetch; absent when unknown.
   */
  balance?: string;
  /**
   * Numeric value of the most recent transaction with this counterparty.
   * Positive = received, negative = sent.
   */
  lastAmount?: number;
  /**
   * Human-readable timestamp of the last known activity,
   * e.g. "Apr 12, 2023".
   */
  lastActivity?: string;
  /** Status string of the last transaction, e.g. "Completed". */
  lastStatus?: string;
  /** Semantic colour bucket for `lastStatus`. */
  lastStatusColor?: "success" | "warning" | "destructive";
  /**
   * ISO 8601 string of when the item was pinned (set automatically by
   * `addItem` in wallet-context).
   */
  pinnedAt: string;
}
