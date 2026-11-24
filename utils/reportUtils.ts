/**
 * Pure aggregation functions for the Reports page.
 *
 * All functions are deterministic and timezone-aware via {@link parseTransactionDate}
 * from `utils/date-utils.ts`. Money sums use integer minor units (cents) to
 * avoid floating-point drift — amounts are parsed as `Math.round(parseFloat(amount) * 100)`
 * before any addition, then divided back to display dollars at the end.
 *
 * @module reportUtils
 */

import type { TransactionProps } from "@/types/transaction";
import { parseTransactionDate } from "@/utils/date-utils";
import { startOfDayUTC, type ParsedTimeWindow } from "@/utils/analyticsTimeWindow";
import { escapeCsvField } from "@/utils/csvUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GroupBy = "day" | "week" | "month";

export interface ReportSummary {
  totalIn: number;
  totalOut: number;
  netFlow: number;
  totalFees: number;
  transactionCount: number;
}

export interface PeriodBucket {
  /** Label for the bucket (e.g. "2026-01-15", "2026-W03", "Jan 2026"). */
  label: string;
  /** ISO date or week/month identifier for sorting. */
  key: string;
  totalIn: number;
  totalOut: number;
  netFlow: number;
  count: number;
}

export interface AssetBreakdown {
  asset: string;
  totalIn: number;
  totalOut: number;
  netFlow: number;
  count: number;
}

export interface CounterpartyBreakdown {
  counterparty: string;
  totalIn: number;
  totalOut: number;
  netFlow: number;
  count: number;
}

export interface ReportData {
  summary: ReportSummary;
  periodBuckets: PeriodBucket[];
  assetBreakdown: AssetBreakdown[];
  counterpartyBreakdown: CounterpartyBreakdown[];
  filteredTransactions: TransactionProps[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a transaction amount string to integer cents to avoid float drift.
 * Returns 0 for unparseable values.
 */
function toCents(amount: string | number | undefined): number {
  if (amount == null) return 0;
  const n = typeof amount === "number" ? amount : parseFloat(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Convert cents back to display dollars. */
function fromCents(cents: number): number {
  return cents / 100;
}

/** Determine if a transaction is incoming (positive amount) or outgoing. */
function isIncoming(amount: string | number | undefined): boolean {
  const n = typeof amount === "number" ? amount : parseFloat(amount ?? "0");
  return n >= 0;
}

/** Parse a transaction's date string to a Date or null. */
function txDate(tx: TransactionProps): Date | null {
  // TransactionProps.date is "MMM dd, yyyy" format (e.g. "Apr 12, 2023")
  return parseTransactionDate(tx.date);
}

// ---------------------------------------------------------------------------
// Date bucketing
// ---------------------------------------------------------------------------

/**
 * Compute a deterministic bucket key for a date based on the grouping mode.
 *
 * - `day`:   `YYYY-MM-DD`
 * - `week`:  ISO week number `YYYY-Www`
 * - `month`: `YYYY-MM`
 */
function bucketKey(date: Date, groupBy: GroupBy): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  if (groupBy === "day") {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  if (groupBy === "month") {
    return `${y}-${String(m).padStart(2, "0")}`;
  }

  // week: ISO week number
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Human-readable label for a bucket key. */
function bucketLabel(key: string, groupBy: GroupBy): string {
  if (groupBy === "day") {
    const [y, m, d] = key.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (groupBy === "month") {
    const [y, m] = key.split("-");
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  // week
  return key;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Filter transactions to those falling within the given UTC time window.
 * Transactions with unparseable dates are excluded.
 */
export function filterByTimeWindow(
  transactions: TransactionProps[],
  window: ParsedTimeWindow,
): TransactionProps[] {
  const fromMs = window.from.getTime();
  const toMs = window.to.getTime() + 86_400_000 - 1; // inclusive end of day

  return transactions.filter((tx) => {
    const date = txDate(tx);
    if (!date) return false;
    const dayMs = startOfDayUTC(date).getTime();
    return dayMs >= fromMs && dayMs <= toMs;
  });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Compute the summary totals (total in, total out, net flow, fees, count)
 * using integer minor-unit arithmetic to avoid float drift.
 */
export function computeSummary(transactions: TransactionProps[]): ReportSummary {
  let inCents = 0;
  let outCents = 0;
  let feeCents = 0;

  for (const tx of transactions) {
    const cents = toCents(tx.amount);
    if (isIncoming(tx.amount)) {
      inCents += cents;
    } else {
      outCents += cents;
    }
    feeCents += toCents(tx.fee);
  }

  return {
    totalIn: fromCents(inCents),
    totalOut: fromCents(Math.abs(outCents)),
    netFlow: fromCents(inCents + outCents), // outCents is negative
    totalFees: fromCents(feeCents),
    transactionCount: transactions.length,
  };
}

// ---------------------------------------------------------------------------
// Period buckets
// ---------------------------------------------------------------------------

/**
 * Group transactions into period buckets (day / week / month) with totals
 * computed in integer cents.
 */
export function groupByPeriod(
  transactions: TransactionProps[],
  groupBy: GroupBy,
): PeriodBucket[] {
  const buckets = new Map<string, { inCents: number; outCents: number; count: number }>();

  for (const tx of transactions) {
    const date = txDate(tx);
    if (!date) continue;

    const key = bucketKey(date, groupBy);
    const cents = toCents(tx.amount);
    const existing = buckets.get(key) ?? { inCents: 0, outCents: 0, count: 0 };

    if (isIncoming(tx.amount)) {
      existing.inCents += cents;
    } else {
      existing.outCents += cents;
    }
    existing.count += 1;
    buckets.set(key, existing);
  }

  const result: PeriodBucket[] = [];
  for (const [key, val] of buckets) {
    result.push({
      key,
      label: bucketLabel(key, groupBy),
      totalIn: fromCents(val.inCents),
      totalOut: fromCents(Math.abs(val.outCents)),
      netFlow: fromCents(val.inCents + val.outCents),
      count: val.count,
    });
  }

  result.sort((a, b) => a.key.localeCompare(b.key));
  return result;
}

// ---------------------------------------------------------------------------
// Asset breakdown
// ---------------------------------------------------------------------------

/**
 * Group transactions by asset (token) with totals computed in integer cents.
 */
export function groupByAsset(transactions: TransactionProps[]): AssetBreakdown[] {
  const groups = new Map<string, { inCents: number; outCents: number; count: number }>();

  for (const tx of transactions) {
    const asset = tx.token || "UNKNOWN";
    const cents = toCents(tx.amount);
    const existing = groups.get(asset) ?? { inCents: 0, outCents: 0, count: 0 };

    if (isIncoming(tx.amount)) {
      existing.inCents += cents;
    } else {
      existing.outCents += cents;
    }
    existing.count += 1;
    groups.set(asset, existing);
  }

  const result: AssetBreakdown[] = [];
  for (const [asset, val] of groups) {
    result.push({
      asset,
      totalIn: fromCents(val.inCents),
      totalOut: fromCents(Math.abs(val.outCents)),
      netFlow: fromCents(val.inCents + val.outCents),
      count: val.count,
    });
  }

  result.sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));
  return result;
}

// ---------------------------------------------------------------------------
// Counterparty breakdown
// ---------------------------------------------------------------------------

/**
 * Group transactions by counterparty with totals computed in integer cents.
 * Falls back to the `address` field when `counterparty` is not set.
 */
export function groupByCounterparty(transactions: TransactionProps[]): CounterpartyBreakdown[] {
  const groups = new Map<string, { inCents: number; outCents: number; count: number }>();

  for (const tx of transactions) {
    const cp = tx.counterparty || tx.address || "Unknown";
    const cents = toCents(tx.amount);
    const existing = groups.get(cp) ?? { inCents: 0, outCents: 0, count: 0 };

    if (isIncoming(tx.amount)) {
      existing.inCents += cents;
    } else {
      existing.outCents += cents;
    }
    existing.count += 1;
    groups.set(cp, existing);
  }

  const result: CounterpartyBreakdown[] = [];
  for (const [cp, val] of groups) {
    result.push({
      counterparty: cp,
      totalIn: fromCents(val.inCents),
      totalOut: fromCents(Math.abs(val.outCents)),
      netFlow: fromCents(val.inCents + val.outCents),
      count: val.count,
    });
  }

  result.sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));
  return result;
}

// ---------------------------------------------------------------------------
// Top counterparties
// ---------------------------------------------------------------------------

/**
 * Return the top N counterparties by absolute transaction volume.
 */
export function topCounterparties(
  breakdown: CounterpartyBreakdown[],
  n: number,
): CounterpartyBreakdown[] {
  return [...breakdown].sort(
    (a, b) => Math.abs(b.totalIn) + Math.abs(b.totalOut) - Math.abs(a.totalIn) - Math.abs(a.totalOut),
  ).slice(0, n);
}

// ---------------------------------------------------------------------------
// Full report
// ---------------------------------------------------------------------------

/**
 * Build a complete report from transactions and a time window.
 */
export function buildReport(
  transactions: TransactionProps[],
  window: ParsedTimeWindow,
  groupBy: GroupBy = "day",
): ReportData {
  const filtered = filterByTimeWindow(transactions, window);

  return {
    summary: computeSummary(filtered),
    periodBuckets: groupByPeriod(filtered, groupBy),
    assetBreakdown: groupByAsset(filtered),
    counterpartyBreakdown: groupByCounterparty(filtered),
    filteredTransactions: filtered,
  };
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

const REPORT_CSV_HEADERS = [
  "Date",
  "Type",
  "Token",
  "Address",
  "Counterparty",
  "Amount",
  "Fee",
  "Status",
];

/**
 * Generate a CSV string from filtered transactions, reusing `escapeCsvField`
 * from `utils/csvUtils.ts` for injection-safe escaping.
 */
export function generateReportCsv(transactions: TransactionProps[]): string {
  const rows = transactions.map((tx) =>
    [
      tx.date,
      tx.type,
      tx.token,
      tx.address,
      tx.counterparty ?? "",
      tx.amount,
      tx.fee ?? "",
      tx.status,
    ].map((v) => escapeCsvField(String(v ?? ""))),
  );

  return [REPORT_CSV_HEADERS.map(escapeCsvField).join(","), ...rows.map((r) => r.join(","))].join("\n");
}
