"use client";

import type { ComponentProps } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { formatDateForDisplay } from "@/utils/date-utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Props for the DateRangeChip component.
 *
 * The component supports both uncontrolled and controlled open/close states:
 * - Pass `open` + `onOpenChange` to control the popover externally
 *   (e.g. close it automatically on date selection in a parent component).
 * - Omit both to let the Popover manage its own open state internally.
 */
export interface DateRangeChipProps {
  /** Currently selected date, or `undefined` when no date is picked. */
  date: Date | undefined;
  /** Called when the user selects or clears a date in the calendar. */
  onDateChange: (date: Date | undefined) => void;
  /** Text shown in the button when no date is selected. Defaults to "Pick a date". */
  placeholder?: string;
  /**
   * Accessible label for the trigger button, read by screen readers.
   * Defaults to the `placeholder` value when not provided.
   */
  "aria-label"?: string;
  /**
   * Optional predicate to disable specific calendar days.
   * Receives the candidate `Date` and returns `true` to disable it.
   */
  disabledDate?: (date: Date) => boolean;
  /**
   * Controlled open state for the popover.
   * Must be paired with `onOpenChange` — use either both or neither.
   */
  open?: boolean;
  /**
   * Called when the popover open state changes (user clicks the trigger or
   * presses Escape / clicks outside).
   * Must be paired with `open` — use either both or neither.
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A date-picker trigger chip used across the Transactions feature.
 *
 * Renders a button that shows either the formatted selected date or a
 * placeholder string, and opens a Calendar popover on activation.
 *
 * ### Accessibility (WCAG 2.1 AA)
 * - The trigger carries an `aria-label` derived from the `aria-label` prop
 *   or the `placeholder` prop so screen readers announce its purpose.
 * - The calendar icon is `aria-hidden="true"` — it is purely decorative; the
 *   text label conveys the meaning.
 * - The trigger inherits the project-wide `focus-visible` ring from
 *   `Button` (3 px ring via `focus-visible:ring-[3px]`), meeting the
 *   non-text contrast requirement (3∶1) for focus indicators.
 * - Keyboard navigation inside the Calendar is handled by the underlying
 *   Radix + react-day-picker primitives (Arrow keys, Page Up/Down, Home/End).
 *
 * ### Sizing
 * A fixed `w-[140px]` prevents the overflow regression introduced by the
 * former `w-[2000px]` typo in `transactions-header.tsx`. The width is wide
 * enough for the widest `formatDateForDisplay` output ("dd-MM-yyyy" = 10 chars)
 * plus the calendar icon.
 *
 * ### Dark mode
 * The calendar overlay uses hardcoded dark surface colours that match the
 * existing design; the button itself uses `bg-transparent` so it inherits the
 * parent surface without imposing a background in either colour scheme.
 */
export function DateRangeChip({
  date,
  onDateChange,
  placeholder = "Pick a date",
  "aria-label": ariaLabel,
  disabledDate,
  open,
  onOpenChange,
}: DateRangeChipProps) {
  // Derive whether the popover is externally controlled.
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const popoverProps = isControlled ? { open, onOpenChange } : {};

  const label = ariaLabel ?? placeholder;

  return (
    <Popover {...popoverProps}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={label}
          className={cn(
            // Fixed width prevents the w-[2000px] overflow bug.
            // min-w-[140px] accommodates "dd-MM-yyyy" (10 chars) + icon.
            "w-[140px] justify-start text-left font-normal",
            "bg-transparent border-[#242428]",
            "text-[#CBD2EB] hover:text-white hover:bg-[#1a1a1a]",
            "h-10 px-3",
          )}
        >
          {/* Decorative: the button aria-label carries the accessible name. */}
          <CalendarIcon
            aria-hidden="true"
            className="mr-2 h-4 w-4 shrink-0 text-[#CBD2EB]"
          />
          {date ? (
            <span className="truncate">{formatDateForDisplay(date)}</span>
          ) : (
            <span className="truncate text-sm text-[#CBD2EB]">
              {placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 bg-[#1a1a1a] border-[#2D2D2D] shadow-lg"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={disabledDate}
          autoFocus
          className="bg-[#1a1a1a] text-white border-0"
          // NOTE: these keys use the react-day-picker v8 shape, cast to avoid
          // a visually-sensitive rewrite for the v10 API — see the matching
          // comment in components/ui/calendar.tsx.
          classNames={
            {
              months:
                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption:
                "flex justify-center pt-1 relative items-center text-white",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent p-0 text-[#CBD2EB] hover:bg-[#2a2a2a]",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-[#CBD2EB] rounded-md w-8 font-normal text-[0.8rem] text-center",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#2a2a2a] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-8 w-8 p-0 font-normal text-white hover:bg-[#2a2a2a] hover:text-white rounded-md",
              day_selected:
                "bg-[#04842E] text-white hover:bg-[#04842E] hover:text-white focus:bg-[#04842E] focus:text-white",
              day_today: "bg-[#2a2a2a] text-white",
              day_outside: "text-[#666] opacity-50",
              day_disabled: "text-[#666] opacity-50",
              day_range_middle:
                "aria-selected:bg-[#2a2a2a] aria-selected:text-white",
              day_hidden: "invisible",
            } as ComponentProps<typeof Calendar>["classNames"]
          }
        />
      </PopoverContent>
    </Popover>
  );
}
