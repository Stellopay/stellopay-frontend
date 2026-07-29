"use client";

import { DateRangeChip } from "./date-range-chip";

interface DateProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
}

/**
 * Single-date picker used by the Transactions filters panel.
 *
 * Thin wrapper around {@link DateRangeChip} that exposes the same props as
 * the original standalone implementation. The Popover is uncontrolled (the
 * chip manages its own open/close state internally) because this consumer does
 * not need to close the picker programmatically on selection.
 */
export function Date({ date, onDateChange, placeholder = "Pick a date" }: DateProps) {
  return (
    <DateRangeChip
      date={date}
      onDateChange={onDateChange}
      placeholder={placeholder}
    />
  );
}
