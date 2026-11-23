"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Download, BarChart3, Loader2, AlertCircle, FileText } from "lucide-react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/common/breadcrumb";
import { ScopedErrorBoundary } from "@/components/common/scoped-error-boundary";
import dynamic from "next/dynamic";
import {
  AnalyticsDatePreset,
  getPresetStartDate,
  startOfDayUTC,
  parseAnalyticsTimeWindow,
  type ParsedTimeWindow,
} from "@/utils/analyticsTimeWindow";
import {
  buildReport,
  generateReportCsv,
  topCounterparties,
  type GroupBy,
} from "@/utils/reportUtils";
import { downloadCsvContent } from "@/utils/csvUtils";
import { formatCurrency } from "@/utils/formatUtils";
import { useTransactions } from "@/hooks/useTransactions";

// Code-split charts so Recharts is not in the initial route chunk
const ReportsChart = dynamic(() => import("@/components/reports/reports-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center" aria-busy="true">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

const BREADCRUMB_TRAIL: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Reports" },
];

const PRESETS: { label: string; value: AnalyticsDatePreset }[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

const GROUP_OPTIONS: { label: string; value: GroupBy }[] = [
  { label: "Daily", value: "day" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
];

export default function ReportsPage() {
  return (
    <ScopedErrorBoundary
      scope="reports"
      fallbackHref="/dashboard"
      fallbackLabel="Back to dashboard"
    >
      <div className="px-4 py-4 md:px-6 w-full max-w-screen-xl mx-auto">
        <Breadcrumb items={BREADCRUMB_TRAIL} />
      </div>
      <ReportsContent />
    </ScopedErrorBoundary>
  );
}

function ReportsContent() {
  const [preset, setPreset] = useState<AnalyticsDatePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  // Resolve the time window
  const window: ParsedTimeWindow | null = useMemo(() => {
    if (preset === "custom") {
      if (!customFrom || !customTo) return null;
      const result = parseAnalyticsTimeWindow({
        preset: "custom",
        from: new Date(customFrom),
        to: new Date(customTo),
      });
      return result.ok ? result.window : null;
    }
    const result = parseAnalyticsTimeWindow({ preset });
    return result.ok ? result.window : null;
  }, [preset, customFrom, customTo]);

  // Fetch transactions (uses the real API, not mock data)
  const { data, isLoading, error } = useTransactions({ pageSize: 1000 });

  const transactions = data?.transactions ?? [];

  // Build the report
  const report = useMemo(() => {
    if (!window) return null;
    return buildReport(transactions, window, groupBy);
  }, [transactions, window, groupBy]);

  const handleDownloadCsv = useCallback(() => {
    if (!report || report.filteredTransactions.length === 0) return;
    const csv = generateReportCsv(report.filteredTransactions);
    const periodStr = preset === "custom"
      ? `${customFrom}_to_${customTo}`
      : preset;
    downloadCsvContent(`stellopay-report-${periodStr}.csv`, csv);
  }, [report, preset, customFrom, customTo]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-4 py-4 md:px-6 w-full max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading transactions…</p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="px-4 py-4 md:px-6 w-full max-w-screen-xl mx-auto">
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Failed to load transactions: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 w-full max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
      </div>

      {/* Controls */}
      <section
        aria-label="Report filters"
        className="rounded-lg border border-border bg-card p-4 space-y-4"
      >
        <div className="flex flex-wrap items-end gap-4">
          {/* Preset selector */}
          <div>
            <label
              htmlFor="report-preset"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Period
            </label>
            <select
              id="report-preset"
              value={preset}
              onChange={(e) => setPreset(e.target.value as AnalyticsDatePreset)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Custom date inputs */}
          {preset === "custom" && (
            <>
              <div>
                <label
                  htmlFor="report-from"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  From
                </label>
                <input
                  id="report-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="report-to"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  To
                </label>
                <input
                  id="report-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}

          {/* Group by */}
          <div>
            <label
              htmlFor="report-group"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Group by
            </label>
            <select
              id="report-group"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              {GROUP_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={!report || report.filteredTransactions.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              aria-label="Download CSV report"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Print report"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Print
            </button>
          </div>
        </div>
      </section>

      {/* Empty state */}
      {!window && (
        <p className="text-sm text-muted-foreground">
          Select a date range to generate a report.
        </p>
      )}

      {window && report && report.filteredTransactions.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No transactions found in this period. Try selecting a different date range.
          </p>
        </div>
      )}

      {/* Summary cards */}
      {window && report && report.filteredTransactions.length > 0 && (
        <>
          <section aria-label="Summary totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Total In" value={formatCurrency(report.summary.totalIn)} />
            <SummaryCard label="Total Out" value={`-${formatCurrency(report.summary.totalOut)}`} />
            <SummaryCard label="Net Flow" value={formatCurrency(report.summary.netFlow)} />
            <SummaryCard label="Total Fees" value={formatCurrency(report.summary.totalFees)} />
          </section>

          {/* Chart */}
          <section aria-label="Net flow chart" className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Net Flow Over Time</h2>
            <ReportsChart data={report.periodBuckets} metric="net" />
          </section>

          {/* Period breakdown table */}
          <section aria-label="Period breakdown" className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Period Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Transaction totals grouped by {groupBy}
                </caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2 text-left font-medium">Period</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">In</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Out</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Net</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {report.periodBuckets.map((b) => (
                    <tr key={b.key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-foreground">{b.label}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{formatCurrency(b.totalIn)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">-{formatCurrency(b.totalOut)}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{formatCurrency(b.netFlow)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{b.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Asset breakdown */}
          <section aria-label="Asset breakdown" className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Per-Asset Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Transaction totals grouped by asset</caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2 text-left font-medium">Asset</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">In</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Out</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Net</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {report.assetBreakdown.map((a) => (
                    <tr key={a.asset} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-foreground">{a.asset}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{formatCurrency(a.totalIn)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">-{formatCurrency(a.totalOut)}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{formatCurrency(a.netFlow)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{a.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top counterparties */}
          <section aria-label="Top counterparties" className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Top Counterparties</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Top 10 counterparties by volume</caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2 text-left font-medium">Counterparty</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">In</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Out</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Net</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topCounterparties(report.counterpartyBreakdown, 10).map((c) => (
                    <tr key={c.counterparty} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-foreground">{c.counterparty}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{formatCurrency(c.totalIn)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">-{formatCurrency(c.totalOut)}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{formatCurrency(c.netFlow)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground font-mono">{value}</p>
    </div>
  );
}
