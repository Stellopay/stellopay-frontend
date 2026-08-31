"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

import { Calendar } from "@/components/ui/calendar";
import Skeleton from "@/components/ui/skeleton";
import { cn } from "@/utils/commonUtils";
import type { AnalyticsViewsProps, AnalyticsDataPoint } from "./analytics-view";
import {
  createUtcRangePredicate,
  parseAnalyticsTimeWindow,
  type AnalyticsDatePreset,
  type TimeWindowError,
} from "@/utils/analyticsTimeWindow";

const AnalyticsViews = dynamic(() => import("./analytics-view"), {
  ssr: false,
});

// ── date helpers ───────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sept: 8, sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Converts a month name (e.g. "Jan", "September") to a Date representing
 * the 15th of that month in the current UTC year.
 *
 * Uses UTC to avoid DST-related day shifts when the month name is resolved
 * to a concrete date.
 */
function monthNameToUtcDate(month: string): Date {
  const lower = month.toLowerCase();
  const monthIndex = MONTH_NAMES[lower] ?? 0;
  const year = new Date().getUTCFullYear();
  // Use the 15th as a representative day for the month (UTC)
  return new Date(Date.UTC(year, monthIndex, 15));
}

// ── date-range presets ─────────────────────────────────────────────────────

export type DateRangePreset = AnalyticsDatePreset;

export interface DateRangeValue {
  preset: DateRangePreset;
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const PRESET_OPTIONS: { key: DateRangePreset; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "custom", label: "Custom" },
];

/**
 * DateRangePicker component.
 *
 * Renders preset range buttons (7d / 30d / 90d) plus a "Custom" option that
 * opens a Calendar popover for selecting an arbitrary date range.
 * Designed to be used within ClientAnalyticsView to filter analytics data.
 */
function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setCalendarOpen(true);
      return;
    }
    setCalendarOpen(false);
    onChange({ preset });
  };

  const handleCustomRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ preset: "custom", from: range.from, to: range.to });
      setCalendarOpen(false);
    }
  };

  return (
    <div className="relative flex items-center gap-1">
      {PRESET_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => handlePresetClick(opt.key)}
          className={cn(
            "h-8 px-3 text-xs font-medium rounded-lg border transition-colors",
            value.preset === opt.key
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800",
          )}
          aria-label={`Select ${opt.label} date range`}
          aria-pressed={value.preset === opt.key}
        >
          {opt.label}
        </button>
      ))}

      {calendarOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setCalendarOpen(false)}
          />
          <div
            className={cn(
              "absolute top-full right-0 mt-2 z-20 rounded-xl border shadow-xl overflow-hidden",
              "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800",
            )}
          >
            <Calendar
              mode="range"
              selected={value.from && value.to ? { from: value.from, to: value.to } : undefined}
              onSelect={handleCustomRangeSelect}
              maxDate={new Date()}
              numberOfMonths={1}
              defaultMonth={new Date()}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── data filtering ─────────────────────────────────────────────────────────

/**
 * Filters analytics data points by the given date range.
 *
 * Uses the UTC-based {@link parseAnalyticsTimeWindow} pipeline so that:
 * - DST transitions never shift the requested window.
 * - Reversed / oversized / same-day ranges are rejected *before* filtering.
 * - Month-name data points are normalised to UTC dates for deterministic
 *   comparison.
 *
 * @returns An object with the filtered data and any validation error.
 */
function filterDataByRange(
  data: AnalyticsDataPoint[],
  range: DateRangeValue,
): { filtered: AnalyticsDataPoint[]; error: TimeWindowError | null } {
  const result = parseAnalyticsTimeWindow({
    preset: range.preset,
    from: range.from,
    to: range.to,
  });

  if (!result.ok) {
    // Validation failed — return all data with the error so the caller
    // can surface the message.  Returning the unfiltered data avoids a
    // blank screen; the error banner explains why filtering is skipped.
    return { filtered: data, error: result.error };
  }

  const { from, to } = result.window;
  const predicate = createUtcRangePredicate(from, to);

  const filtered = data.filter((point) => {
    const pointDate = monthNameToUtcDate(point.month);
    return predicate(pointDate);
  });

  return { filtered, error: null };
}

// ── component ──────────────────────────────────────────────────────────────

/**
 * Extended props for ClientAnalyticsView that include date-range selection.
 */
export interface ClientAnalyticsViewProps extends AnalyticsViewsProps {
  /**
   * Optional controlled date range. When omitted the component manages its
   * own internal state (defaults to 30d).
   */
  dateRange?: DateRangeValue;
  /**
   * Optional callback fired when the user changes the date range.
   */
  onDateRangeChange?: (range: DateRangeValue) => void;
}

/**
 * ClientAnalyticsView wrapper that dynamically loads the heavy recharts-based
 * AnalyticsViews component on the client-side with an accessible skeleton loader.
 * Ensures the main bundle does not include large charting libraries on first paint.
 *
 * Also provides an integrated date-range picker with presets (7d / 30d / 90d / custom)
 * that filters the analytics data before rendering.
 */
export default function ClientAnalyticsView(props: ClientAnalyticsViewProps) {
  const { dateRange: controlledRange, onDateRangeChange, ...viewProps } = props;
  const [isMounted, setIsMounted] = useState(false);
  const [internalRange, setInternalRange] = useState<DateRangeValue>({
    preset: "30d",
  });

  // Use controlled range if provided, otherwise internal state
  const activeRange = controlledRange ?? internalRange;

  const handleRangeChange = useCallback(
    (range: DateRangeValue) => {
      setInternalRange(range);
      onDateRangeChange?.(range);
    },
    [onDateRangeChange],
  );

  // Validate and filter data based on selected date range
  const { filtered: filteredData, error: timeWindowError } = useMemo(() => {
    if (!viewProps.data || viewProps.data.length === 0)
      return { filtered: viewProps.data, error: null };
    return filterDataByRange(viewProps.data, activeRange);
  }, [viewProps.data, activeRange]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || viewProps.isLoading) {
    if (viewProps.showNotifications) {
      return (
        <div
          className="max-w-full min-h-[332px] flex flex-col md:flex-row gap-6"
          aria-busy="true"
          aria-live="polite"
          role="status"
        >
          <span className="sr-only">Loading analytics...</span>
          <div className="w-full md:w-2/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-card transition-colors flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-lg" shade="dark" />
                <Skeleton className="h-6 w-32" shade="dark" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" shade="dark" />
            </div>
            <div className="w-full h-56 rounded-lg border border-zinc-100 dark:border-zinc-800/50 p-2 sm:p-4">
              <div className="h-full flex items-end gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="flex-1"
                    shade="dark"
                    style={{ height: `${20 + (i % 4) * 15}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-card flex flex-col gap-6 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" shade="dark" />
                <Skeleton className="h-6 w-24" shade="dark" />
              </div>
              <Skeleton className="h-10 w-20 rounded-xl" shade="dark" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-20 rounded-xl" shade="dark" />
              <Skeleton className="h-20 rounded-xl" shade="dark" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="bg-[#0D0D0D80] text-white rounded-xl border border-[#2D2D2D] p-4 w-full h-full flex flex-col justify-between"
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        <span className="sr-only">Loading analytics views chart...</span>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-lg" shade="dark" />
            <Skeleton className="h-6 w-32" shade="dark" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" shade="dark" />
        </div>

        <div className="w-full h-full aspect-[3/1] rounded-lg border border-[#2D2D2D] p-2 sm:p-4">
          <div className="h-full flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                shade="dark"
                style={{ height: `${20 + (i % 4) * 15}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DateRangePicker value={activeRange} onChange={handleRangeChange} />
      {timeWindowError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          {timeWindowError.message}
        </div>
      )}
      <AnalyticsViews {...viewProps} data={filteredData} />
    </div>
  );
}
