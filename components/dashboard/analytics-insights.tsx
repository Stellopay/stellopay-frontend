"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Activity,
  Wallet,
  ChevronDown,
  ArrowRight,
  Settings,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { safeStorage } from "@/utils/safeStorage";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface KPICardItem {
  id: string;
  icon: LucideIcon;
  value: string;
  label: string;
  change: string;
  iconColor: string;
  iconBg: string;
}

const timeRangeOptions = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "This year",
];

const METRIC_CATALOG: KPICardItem[] = [
  {
    id: "total-volume",
    icon: TrendingUp,
    value: "$847.5K",
    label: "Total Volume",
    change: "+12.5%",
    iconColor: "text-[#2563EB] dark:text-[#60A5FA]",
    iconBg: "bg-[#EFF6FF] dark:bg-[#1E3A5F]",
  },
  {
    id: "avg-transaction",
    icon: DollarSign,
    value: "$3,245",
    label: "Avg. Transaction",
    change: "+8.2%",
    iconColor: "text-[#16A34A] dark:text-[#4ADE80]",
    iconBg: "bg-[#F0FDF4] dark:bg-[#14532D]",
  },
  {
    id: "success-rate",
    icon: Activity,
    value: "99.2%",
    label: "Success Rate",
    change: "+0.3%",
    iconColor: "text-[#7C3AED] dark:text-[#A78BFA]",
    iconBg: "bg-[#F5F3FF] dark:bg-[#3B2864]",
  },
  {
    id: "active-wallets",
    icon: Wallet,
    value: "156",
    label: "Active Wallets",
    change: "+24",
    iconColor: "text-[#EA580C] dark:text-[#FB923C]",
    iconBg: "bg-[#FFF7ED] dark:bg-[#431407]",
  },
];

// Default metric IDs for first-time users (all 4 metrics)
const DEFAULT_SELECTED_METRIC_IDS = [
  "total-volume",
  "avg-transaction",
  "success-rate",
  "active-wallets",
];

const STORAGE_KEY = "stellopay.kpi-preferences";
const MAX_VISIBLE_METRICS = 4;

// Derive the default KPIs for backward compatibility
const defaultKPIs: KPICardItem[] = METRIC_CATALOG;

interface AnalyticsInsightsProps {
  kpis?: KPICardItem[];
  viewAllHref?: string;
}

/**
 * MetricPickerDialog Component
 * Allows users to select which metrics to display (up to 4)
 */
function MetricPickerDialog({
  selectedMetricIds,
  onMetricsChange,
}: {
  selectedMetricIds: string[];
  onMetricsChange: (ids: string[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState(selectedMetricIds);

  // Reset temp selection when dialog closes without saving
  useEffect(() => {
    if (!dialogOpen) {
      setTempSelectedIds(selectedMetricIds);
    }
  }, [dialogOpen, selectedMetricIds]);

  const isMetricSelected = (id: string): boolean => tempSelectedIds.includes(id);
  const isMetricDisabled = (id: string): boolean =>
    tempSelectedIds.length >= MAX_VISIBLE_METRICS && !isMetricSelected(id);

  const handleToggleMetric = (id: string) => {
    if (isMetricSelected(id)) {
      setTempSelectedIds(tempSelectedIds.filter((m) => m !== id));
    } else if (tempSelectedIds.length < MAX_VISIBLE_METRICS) {
      setTempSelectedIds([...tempSelectedIds, id]);
    }
  };

  const handleSave = () => {
    onMetricsChange(tempSelectedIds);
    setDialogOpen(false);
  };

  const handleReset = () => {
    setTempSelectedIds(DEFAULT_SELECTED_METRIC_IDS);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2",
          )}
          aria-label="Customize metrics"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Customize</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Metrics</DialogTitle>
          <DialogDescription>
            Select up to {MAX_VISIBLE_METRICS} metrics to display. Your
            selection will be saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-6 max-h-[400px] overflow-y-auto">
          {METRIC_CATALOG.map((metric) => {
            const Icon = metric.icon;
            const selected = isMetricSelected(metric.id);
            const disabled = isMetricDisabled(metric.id);

            return (
              <button
                key={metric.id}
                type="button"
                onClick={() => handleToggleMetric(metric.id)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  selected
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700/50"
                    : "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/50",
                  disabled && "opacity-50 cursor-not-allowed",
                  !disabled && !selected && "hover:bg-zinc-100 dark:hover:bg-zinc-900/50 cursor-pointer",
                )}
                aria-pressed={selected}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-all",
                    metric.iconBg,
                    metric.iconColor,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {metric.label}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {metric.value}
                  </div>
                </div>
                {selected && (
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {tempSelectedIds.length === 0 && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Please select at least one metric.
            </p>
          </div>
        )}

        {tempSelectedIds.length === MAX_VISIBLE_METRICS && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Maximum {MAX_VISIBLE_METRICS} metrics selected. Unselect one to add
              another.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={tempSelectedIds.length === 0}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-lg text-white transition-colors",
              tempSelectedIds.length === 0
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700",
            )}
          >
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AnalyticsInsightsProps {
  kpis?: KPICardItem[];
  viewAllHref?: string;
}

export function AnalyticsInsights({
  kpis = defaultKPIs,
  viewAllHref = "/analytics-view",
}: AnalyticsInsightsProps) {
  const [timeRange, setTimeRange] = useState(timeRangeOptions[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load persisted metric selection on mount
  useEffect(() => {
    const saved = safeStorage.getItem(STORAGE_KEY);
    let ids = DEFAULT_SELECTED_METRIC_IDS;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          ids = parsed;
        }
      } catch (e) {
        // Silently fall back to default if parsing fails
      }
    }

    setSelectedMetricIds(ids);
    setHasHydrated(true);
  }, []);

  // Save metric selection to localStorage when it changes (after hydration)
  useEffect(() => {
    if (!hasHydrated) return;
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMetricIds));
  }, [selectedMetricIds, hasHydrated]);

  // Get the KPIs to display based on selected IDs, maintaining order from the catalog
  const visibleKPIs = hasHydrated
    ? METRIC_CATALOG.filter((metric) => selectedMetricIds.includes(metric.id))
    : defaultKPIs;

  const handleMetricsChange = (ids: string[]) => {
    setSelectedMetricIds(ids);
  };

  return (
    <section
      className={cn(
        "rounded-2xl border p-6 transition-all",
        "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 shadow-elevation-1",
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Analytics & Insights
          </h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Track your payment activity and performance
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors",
                "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800",
                "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select time range"
            >
              {timeRange}
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden="true"
                  onClick={() => setDropdownOpen(false)}
                />
                <ul
                  role="listbox"
                  className={cn(
                    "absolute top-full right-0 mt-2 min-w-[160px] py-1 rounded-xl border shadow-xl z-20 overflow-hidden",
                    "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800",
                  )}
                >
                  {timeRangeOptions.map((option) => (
                    <li
                      key={option}
                      role="option"
                      aria-selected={timeRange === option}
                      onClick={() => {
                        setTimeRange(option);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors",
                        "text-zinc-600 dark:text-zinc-400",
                        "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                        timeRange === option &&
                          "bg-zinc-50 dark:bg-zinc-900/50 text-blue-600 dark:text-blue-400",
                      )}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {hasHydrated && (
            <MetricPickerDialog
              selectedMetricIds={selectedMetricIds}
              onMetricsChange={handleMetricsChange}
            />
          )}
          <Link href={viewAllHref}>
            <button className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleKPIs.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col group hover:shadow-elevation-2 transition-all",
                "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                    item.iconBg,
                    item.iconColor,
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {item.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-4 tracking-tight">
                  {item.value}
                </p>
                <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
