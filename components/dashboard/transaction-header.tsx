"use client";

import { useEffect, useRef } from "react";
import { Date } from "../transactions/date";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SortField, SortDirection } from "@/types/transaction";

interface TransactionHeaderProps {
  pageTitle: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
}

const columns: { key: SortField; label: string }[] = [
  { key: "type", label: "Transaction Type" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

export default function TransactionHeader({
  pageTitle,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  sortField,
  sortDirection,
  onSort,
}: TransactionHeaderProps) {
  const liveRegionRef = useRef<HTMLParagraphElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (liveRegionRef.current && sortField && onSort) {
      const direction = sortDirection === "asc" ? "ascending" : "descending";
      liveRegionRef.current.textContent = `Sorted by ${sortField} ${direction}`;
    }
  }, [sortField, sortDirection, onSort]);

  return (
    <div className="w-full px-4 md:px-6 pt-4 border-b border-[#1A1A1A]">
      <p ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />
      <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-white text-2xl font-semibold pl-4">{pageTitle}</h1>
        <div className="flex items-center justify-between gap-4">
          <Date
            date={startDate}
            onDateChange={onStartDateChange}
            placeholder="Start date"
          />
          <span className="text-sm text-[#e5e5e5]">To</span>
          <Date
            date={endDate}
            onDateChange={onEndDateChange}
            placeholder="End date"
          />
        </div>
      </div>
      {onSort && (
        <div className="max-w-screen-xl mx-auto flex items-center gap-6 px-4 py-3">
          {columns.map((col) => {
            const isActive = sortField === col.key;
            const isAsc = sortDirection === "asc";
            return (
              <button
                key={col.key}
                onClick={() => onSort(col.key)}
                aria-sort={
                  isActive
                    ? isAsc
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {col.label}
                {isActive ? (
                  isAsc ? (
                    <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )
                ) : (
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
