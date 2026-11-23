import type { Transaction } from "@/types/transaction";
import {
  getTransactionTimestamp,
  parseTransactionDate,
} from "@/utils/date-utils";

export const TAX_STATEMENT_DISCLAIMER =
  "Statements and summaries are generated for informational and reconciliation purposes only and do not constitute official tax or financial advice. Consult a qualified tax professional regarding local tax obligations.";

export type TaxPeriodType = "year" | "quarter";

export interface TaxPeriod {
  id: string;
  period: string; // e.g. "Tax year 2025" or "Q2 2026"
  dateRange: string; // e.g. "Jan 1 - Dec 31, 2025" or "Apr 1 - Jun 30, 2026"
  type: "Tax summary" | "Transaction statement";
  periodType: TaxPeriodType;
  year: number;
  quarter?: 1 | 2 | 3 | 4;
}

export interface TaxAssetSummary {
  asset: string;
  totalIncome: number;
  totalOutgoing: number;
  netTotal: number;
  totalFees: number;
  transactionCount: number;
}

export interface TaxReportTransaction {
  id: string;
  txId: string;
  date: string;
  time: string;
  localDate: string;
  type: string;
  token: string;
  amount: number;
  fee: number;
  address: string;
  status: string;
  memo?: string;
}

export interface TaxReportData {
  period: TaxPeriod;
  timezone: string;
  generatedAt: string;
  assetSummaries: TaxAssetSummary[];
  transactions: TaxReportTransaction[];
  disclaimer: string;
}

/**
 * Parses date string and time into a Date object.
 */
export function parseTransactionToDate(
  dateStr: string,
  timeStr = "",
): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // If already full ISO
  if (trimmed.includes("T")) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const iso = getTransactionTimestamp(trimmed, timeStr);
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // "MMM dd, yyyy"
  const parsed = parseTransactionDate(trimmed);
  if (parsed && !Number.isNaN(parsed.getTime())) {
    if (timeStr) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      const iso = getTransactionTimestamp(`${yyyy}-${mm}-${dd}`, timeStr);
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return parsed;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Extracts zoned calendar year, month (1-12), day (1-31), and quarter (1-4).
 */
export function getZonedCalendarParts(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number; quarter: 1 | 2 | 3 | 4 } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth() + 1;
    let day = date.getUTCDate();

    for (const part of parts) {
      if (part.type === "year") year = parseInt(part.value, 10);
      if (part.type === "month") month = parseInt(part.value, 10);
      if (part.type === "day") day = parseInt(part.value, 10);
    }

    const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
    return { year, month, day, quarter };
  } catch {
    // If timezone is invalid or unsupported, fall back to UTC
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
    return { year, month, day, quarter };
  }
}

const QUARTER_DATE_RANGES: Record<1 | 2 | 3 | 4, (year: number) => string> = {
  1: (year) => `Jan 1 - Mar 31, ${year}`,
  2: (year) => `Apr 1 - Jun 30, ${year}`,
  3: (year) => `Jul 1 - Sep 30, ${year}`,
  4: (year) => `Oct 1 - Dec 31, ${year}`,
};

/**
 * Derives available tax periods (years and quarters with transaction activity)
 * evaluated in the user's timezone.
 */
export function deriveTaxPeriods(
  transactions: Transaction[],
  timeZone: string,
): TaxPeriod[] {
  const yearsWithActivity = new Set<number>();
  const quartersWithActivity = new Set<string>(); // "year-quarter", e.g. "2026-2"

  for (const tx of transactions) {
    const date = parseTransactionToDate(tx.date, tx.time);
    if (!date) continue;
    const { year, quarter } = getZonedCalendarParts(date, timeZone);
    yearsWithActivity.add(year);
    quartersWithActivity.add(`${year}-${quarter}`);
  }

  if (yearsWithActivity.size === 0) return [];

  const sortedYears = Array.from(yearsWithActivity).sort((a, b) => b - a);
  const result: TaxPeriod[] = [];

  for (const year of sortedYears) {
    // Annual summary for the year
    result.push({
      id: `tax-${year}`,
      period: `Tax year ${year}`,
      dateRange: `Jan 1 - Dec 31, ${year}`,
      type: "Tax summary",
      periodType: "year",
      year,
    });

    // Quarters in descending order (Q4 down to Q1)
    for (const q of [4, 3, 2, 1] as const) {
      if (quartersWithActivity.has(`${year}-${q}`)) {
        result.push({
          id: `stmt-${year}-q${q}`,
          period: `Q${q} ${year}`,
          dateRange: QUARTER_DATE_RANGES[q](year),
          type: "Transaction statement",
          periodType: "quarter",
          year,
          quarter: q,
        });
      }
    }
  }

  return result;
}

const MINOR_UNIT_SCALE = 100; // Integer minor units (cents)

/**
 * Pure function: filters transactions for the selected period in user's timezone
 * and calculates integer-minor-unit totals of income, outgoing, fees per asset.
 */
export function buildTaxReportData(
  transactions: Transaction[],
  period: TaxPeriod,
  timeZone: string,
): TaxReportData {
  const matchingTx: TaxReportTransaction[] = [];
  const assetMap = new Map<
    string,
    {
      incomeMinor: number;
      outgoingMinor: number;
      feesMinor: number;
      count: number;
    }
  >();

  for (const tx of transactions) {
    const date = parseTransactionToDate(tx.date, tx.time);
    if (!date) continue;

    const { year, month, day, quarter } = getZonedCalendarParts(date, timeZone);

    // Period match check
    let matches = false;
    if (period.periodType === "year") {
      matches = year === period.year;
    } else if (period.periodType === "quarter") {
      matches = year === period.year && quarter === period.quarter;
    }

    if (!matches) continue;

    const token = tx.token || "UNKNOWN";
    const amountMinor = Math.round(tx.amount * MINOR_UNIT_SCALE);
    const rawFee =
      typeof (tx as unknown as { fee?: unknown }).fee === "number"
        ? (tx as unknown as { fee: number }).fee
        : typeof (tx as unknown as { fee?: unknown }).fee === "string"
          ? parseFloat((tx as unknown as { fee: string }).fee)
          : 0;
    const feeNum = Number.isFinite(rawFee) ? Math.max(rawFee, 0) : 0;
    const feeMinor = Math.round(feeNum * MINOR_UNIT_SCALE);

    const assetRecord = assetMap.get(token) ?? {
      incomeMinor: 0,
      outgoingMinor: 0,
      feesMinor: 0,
      count: 0,
    };

    if (amountMinor > 0) {
      assetRecord.incomeMinor += amountMinor;
    } else if (amountMinor < 0) {
      assetRecord.outgoingMinor += Math.abs(amountMinor);
    }
    assetRecord.feesMinor += feeMinor;
    assetRecord.count += 1;
    assetMap.set(token, assetRecord);

    const localDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    matchingTx.push({
      id: tx.id,
      txId: tx.txId || tx.id,
      date: tx.date,
      time: tx.time,
      localDate,
      type: tx.type,
      token,
      amount: tx.amount,
      fee: feeNum,
      address: tx.address,
      status: tx.status,
      memo: tx.memo,
    });
  }

  // Convert minor units back to standard decimals
  const assetSummaries: TaxAssetSummary[] = Array.from(assetMap.entries())
    .map(([asset, sums]) => ({
      asset,
      totalIncome: sums.incomeMinor / MINOR_UNIT_SCALE,
      totalOutgoing: sums.outgoingMinor / MINOR_UNIT_SCALE,
      netTotal: (sums.incomeMinor - sums.outgoingMinor) / MINOR_UNIT_SCALE,
      totalFees: sums.feesMinor / MINOR_UNIT_SCALE,
      transactionCount: sums.count,
    }))
    .sort((a, b) => a.asset.localeCompare(b.asset));

  return {
    period,
    timezone: timeZone,
    generatedAt: new Date().toISOString(),
    assetSummaries,
    transactions: matchingTx,
    disclaimer: TAX_STATEMENT_DISCLAIMER,
  };
}

/**
 * Generates a clean CSV statement from tax report data.
 */
export function generateTaxReportCsv(data: TaxReportData): string {
  const lines: string[] = [];

  // Header metadata
  lines.push(`"Stellopay Statement - ${data.period.period}"`);
  lines.push(`"Date Range: ${data.period.dateRange}"`);
  lines.push(`"Timezone: ${data.timezone}"`);
  lines.push(`"Generated: ${data.generatedAt}"`);
  lines.push(`"Disclaimer: ${data.disclaimer}"`);
  lines.push("");

  // Asset totals section
  lines.push("Summary by Asset");
  lines.push(
    "Asset,Total Income,Total Outgoing,Net Total,Total Fees,Transaction Count",
  );
  for (const a of data.assetSummaries) {
    lines.push(
      `"${a.asset}",${a.totalIncome.toFixed(2)},${a.totalOutgoing.toFixed(2)},${a.netTotal.toFixed(2)},${a.totalFees.toFixed(2)},${a.transactionCount}`,
    );
  }
  lines.push("");

  // Transaction rows section
  lines.push("Transactions");
  lines.push(
    "Transaction ID,Local Date,Time,Type,Asset,Amount,Fee,Counterparty,Status,Memo",
  );
  for (const t of data.transactions) {
    const memoEscaped = (t.memo || "").replace(/"/g, '""');
    lines.push(
      `"${t.txId}","${t.localDate}","${t.time}","${t.type}","${t.token}",${t.amount.toFixed(2)},${t.fee.toFixed(2)},"${t.address}","${t.status}","${memoEscaped}"`,
    );
  }

  return lines.join("\r\n");
}

/**
 * Generates a PDF statement blob using lazily imported jsPDF.
 */
export async function generateTaxReportPdfBlob(
  data: TaxReportData,
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("StelloPay Financial Statement", 40, 50);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`Period: ${data.period.period} (${data.period.dateRange})`, 40, 72);
  doc.text(`Timezone: ${data.timezone}`, 40, 88);
  doc.text(
    `Generated: ${new Date(data.generatedAt).toLocaleString()}`,
    40,
    104,
  );

  // Asset Summaries
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Summary by Asset", 40, 135);

  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text("Asset", 40, 152);
  doc.text("Income", 120, 152);
  doc.text("Outgoing", 200, 152);
  doc.text("Net Total", 280, 152);
  doc.text("Fees", 360, 152);
  doc.text("Tx Count", 440, 152);

  let y = 168;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30);

  if (data.assetSummaries.length === 0) {
    doc.text("No transactions in this period.", 40, y);
    y += 20;
  } else {
    for (const a of data.assetSummaries) {
      doc.text(a.asset, 40, y);
      doc.text(a.totalIncome.toFixed(2), 120, y);
      doc.text(a.totalOutgoing.toFixed(2), 200, y);
      doc.text(a.netTotal.toFixed(2), 280, y);
      doc.text(a.totalFees.toFixed(2), 360, y);
      doc.text(String(a.transactionCount), 440, y);
      y += 18;
    }
  }

  y += 15;
  // Transactions section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Recent Transactions", 40, y);
  y += 18;

  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text("Tx ID", 40, y);
  doc.text("Date", 110, y);
  doc.text("Type", 170, y);
  doc.text("Asset", 250, y);
  doc.text("Amount", 310, y);
  doc.text("Status", 370, y);
  y += 15;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30);
  const rowsToPrint = data.transactions.slice(0, 25);
  for (const t of rowsToPrint) {
    if (y > 750) {
      doc.addPage();
      y = 40;
    }
    doc.text(t.txId.substring(0, 12), 40, y);
    doc.text(t.localDate, 110, y);
    doc.text(t.type.substring(0, 16), 170, y);
    doc.text(t.token, 250, y);
    doc.text(t.amount.toFixed(2), 310, y);
    doc.text(t.status, 370, y);
    y += 14;
  }

  if (data.transactions.length > 25) {
    doc.setFont("helvetica", "italic");
    doc.text(
      `...and ${data.transactions.length - 25} more transactions (full list in CSV export).`,
      40,
      y + 6,
    );
    y += 20;
  }

  // Disclaimer footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120);
  const splitDisclaimer = doc.splitTextToSize(data.disclaimer, pageWidth - 80);
  doc.text(splitDisclaimer, 40, pageHeight - 35);

  return doc.output("blob");
}

/**
 * Downloads a Blob safely via an ephemeral Object URL and revokes it.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke object URL after click
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
