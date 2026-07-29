"use client";

import { useState } from "react";
import { DateRangeChip } from "./date-range-chip";
import { TransactionsHeaderProps } from "@/types/transaction";
import { formatDateForInput } from "@/utils/date-utils";

/**
 * Page header for the Transactions view.
 *
 * Renders the "Transactions" heading alongside a From / To date range picker.
 * Both pickers are controlled so they close automatically when the user
 * selects a date.
 *
 * ### Bug fix
 * The previous "From" button had `w-[2000px]`, causing it to overflow its
 * container on every viewport. Both pickers now use the shared
 * {@link DateRangeChip}, which applies a consistent `w-[140px]`.
 *
 * ### Typo fix
 * The previous separator read "Tom" — corrected to "to".
 */
export default function TransactionsHeader({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: TransactionsHeaderProps) {
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);

  const fromDateObj = fromDate ? new Date(fromDate) : undefined;
  const toDateObj = toDate ? new Date(toDate) : undefined;

  const handleFromDateSelect = (date: Date | undefined) => {
    if (date) {
      onFromDateChange(formatDateForInput(date));
      setFromDateOpen(false);
    }
  };

  const handleToDateSelect = (date: Date | undefined) => {
    if (date) {
      onToDateChange(formatDateForInput(date));
      setToDateOpen(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 bg-[#1a0c1d] mb-4">
      <h1 className="text-2xl font-semibold mb-4 lg:mb-0 text-white">
        Transactions
      </h1>

      {/* Date range picker */}
      <div className="flex items-center gap-3">
        <DateRangeChip
          date={fromDateObj}
          onDateChange={handleFromDateSelect}
          placeholder="From"
          aria-label="Filter from date"
          open={fromDateOpen}
          onOpenChange={setFromDateOpen}
          disabledDate={(date) => (toDateObj ? date > toDateObj : false)}
        />

        <span className="text-gray-400 text-sm" aria-hidden="true">
          to
        </span>

        <DateRangeChip
          date={toDateObj}
          onDateChange={handleToDateSelect}
          placeholder="To"
          aria-label="Filter to date"
          open={toDateOpen}
          onOpenChange={setToDateOpen}
          disabledDate={(date) => (fromDateObj ? date < fromDateObj : false)}
        />
      </div>
    </div>
  );
}
