"use client";

import { useState, useCallback, useRef, useEffect, useId } from "react";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Date } from "./date";
import { TRANSACTION_CSV_COLUMNS } from "@/utils/csvUtils";
import { formatDateForInput } from "@/utils/date-utils";
import type { CsvExportColumn } from "@/utils/csvUtils";

export interface ExportToolbarProps {
  /** Number of rows that match the current export date range, or null if not yet fetched. */
  previewCount: number | null;
  /** Whether the preview count is currently being fetched. */
  isLoadingPreview: boolean;
  /** Called when the user changes the date range — triggers preview re-fetch. */
  onPreviewRequest: (dateRange: { fromDate: string; toDate: string }) => void;
  /** Called when the user clicks the Export button. */
  onExport: (selectedColumns: string[], dateRange: { fromDate: string; toDate: string }) => void;
  /** Whether the export download is in progress. */
  isExporting: boolean;
  /** Default from date (YYYY-MM-DD) for the date pickers. */
  defaultFromDate: string;
  /** Default to date (YYYY-MM-DD) for the date pickers. */
  defaultToDate: string;
  /** Called when the dialog closes — lets the parent reset stale state. */
  onDialogClose?: () => void;
}

/**
 * CsvExportToolbar
 *
 * A dialog-based export toolbar that lets power users:
 * - Choose which columns to include in the CSV via a checklist
 * - Scope the export to an arbitrary date range independent of on-screen pagination
 * - Preview the row count before generating the download
 *
 * Accessibility (WCAG 2.1 AA):
 * - Dialog uses `role="dialog"` with `aria-modal="true"` via the Dialog primitive.
 * - Column checkboxes are labelled with the column header text.
 * - Focus is trapped within the dialog while open.
 * - The row-count preview uses `aria-live="polite"` so screen readers announce updates.
 * - All controls have visible focus-visible rings.
 */
export default function CsvExportToolbar({
  previewCount,
  isLoadingPreview,
  onPreviewRequest,
  onExport,
  isExporting,
  defaultFromDate,
  defaultToDate,
  onDialogClose,
}: ExportToolbarProps) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set(TRANSACTION_CSV_COLUMNS.map((c) => c.key)),
  );
  const [fromDate, setFromDate] = useState<Date | undefined>(
    () => new Date(defaultFromDate),
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    () => new Date(defaultToDate),
  );

  const rowCountId = useId();
  const prevOpenRef = useRef(false);

  // When the dialog opens, request a preview using the current date range.
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const fromStr =
        fromDate && !isNaN(fromDate.getTime())
          ? formatDateForInput(fromDate)
          : defaultFromDate;
      const toStr =
        toDate && !isNaN(toDate.getTime())
          ? formatDateForInput(toDate)
          : defaultToDate;
      onPreviewRequest({ fromDate: fromStr, toDate: toStr });
    }
    prevOpenRef.current = open;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        // Reset state when closing
        setSelectedColumns(new Set(TRANSACTION_CSV_COLUMNS.map((c) => c.key)));
        setFromDate(new Date(defaultFromDate));
        setToDate(new Date(defaultToDate));
        onDialogClose?.();
      }
    },
    [defaultFromDate, defaultToDate, onDialogClose],
  );

  const toggleColumn = useCallback((key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAllColumns = useCallback(() => {
    setSelectedColumns((prev) => {
      if (prev.size === TRANSACTION_CSV_COLUMNS.length) {
        return new Set();
      }
      return new Set(TRANSACTION_CSV_COLUMNS.map((c) => c.key));
    });
  }, []);

  const handleFromDateChange = useCallback(
    (date: Date | undefined) => {
      setFromDate(date);
      if (date && !isNaN(date.getTime()) && toDate && !isNaN(toDate.getTime())) {
        onPreviewRequest({
          fromDate: formatDateForInput(date),
          toDate: formatDateForInput(toDate),
        });
      }
    },
    [toDate, onPreviewRequest],
  );

  const handleToDateChange = useCallback(
    (date: Date | undefined) => {
      setToDate(date);
      if (fromDate && !isNaN(fromDate.getTime()) && date && !isNaN(date.getTime())) {
        onPreviewRequest({
          fromDate: formatDateForInput(fromDate),
          toDate: formatDateForInput(date),
        });
      }
    },
    [fromDate, onPreviewRequest],
  );

  const handleExport = useCallback(() => {
    if (selectedColumns.size === 0 || isExporting) return;
    const fromStr =
      fromDate && !isNaN(fromDate.getTime())
        ? formatDateForInput(fromDate)
        : defaultFromDate;
    const toStr =
      toDate && !isNaN(toDate.getTime())
        ? formatDateForInput(toDate)
        : defaultToDate;
    onExport(Array.from(selectedColumns), { fromDate: fromStr, toDate: toStr });
    setOpen(false);
  }, [selectedColumns, fromDate, toDate, defaultFromDate, defaultToDate, onExport, isExporting]);

  const allSelected = selectedColumns.size === TRANSACTION_CSV_COLUMNS.length;
  const canExport = selectedColumns.size > 0 && !isExporting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="gap-2 border-[#2D2D2D] bg-[#1a0c1d] text-white hover:bg-[#2a1a2d] hover:text-white"
          aria-label="Open CSV export options"
        >
          <FileSpreadsheet size={18} strokeWidth={1.5} />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-lg border-[#2D2D2D] bg-[#160f17] text-white sm:max-w-xl"
        aria-describedby={`${rowCountId}-description`}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Export Transactions</DialogTitle>
          <DialogDescription
            id={`${rowCountId}-description`}
            className="text-gray-400"
          >
            Choose which columns to include and select a date range for your
            export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ── Date Range ──────────────────────────────────────────── */}
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-gray-300">
              Date Range
            </legend>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Date
                date={fromDate}
                onDateChange={handleFromDateChange}
                placeholder="From date"
              />
              <span className="text-center text-sm text-gray-500 sm:px-1">
                to
              </span>
              <Date
                date={toDate}
                onDateChange={handleToDateChange}
                placeholder="To date"
              />
            </div>
          </fieldset>

          {/* ── Column Selection ────────────────────────────────────── */}
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-gray-300">
              Columns to Export
            </legend>
            <div className="mb-2">
              <button
                type="button"
                onClick={toggleAllColumns}
                className="text-xs text-gray-400 underline-offset-2 hover:text-gray-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div
              role="group"
              aria-label="Select columns to export"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {TRANSACTION_CSV_COLUMNS.map((col: CsvExportColumn) => (
                <div key={col.key} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`export-col-${col.key}`}
                    checked={selectedColumns.has(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                    aria-labelledby={`export-col-label-${col.key}`}
                  />
                  <Label
                    id={`export-col-label-${col.key}`}
                    htmlFor={`export-col-${col.key}`}
                    className="cursor-pointer text-sm text-gray-200"
                  >
                    {col.header}
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* ── Row Count Preview ──────────────────────────────────── */}
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-[#2D2D2D] bg-[#1a0c1d] px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Rows to export</span>
              {isLoadingPreview ? (
                <RefreshCw
                  size={16}
                  className="animate-spin text-gray-400"
                  aria-hidden="true"
                />
              ) : (
                <span className="text-lg font-semibold text-white tabular-nums">
                  {previewCount !== null ? previewCount.toLocaleString() : "—"}
                </span>
              )}
            </div>
            {previewCount === 0 && !isLoadingPreview && (
              <p className="mt-1 text-xs text-amber-400">
                No transactions match this date range.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white hover:bg-[#2a1a2d]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport}
            className="gap-2 bg-[#04842E] text-white hover:bg-[#036b24] disabled:opacity-50"
            aria-label={
              isExporting
                ? "Exporting CSV..."
                : selectedColumns.size === 0
                  ? "Select at least one column to export"
                  : "Download CSV export"
            }
          >
            {isExporting ? (
              <>
                <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                Exporting…
              </>
            ) : (
              <>
                <Download size={16} strokeWidth={1.5} />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
