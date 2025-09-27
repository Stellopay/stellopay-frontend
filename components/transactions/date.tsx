"use client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
}

export function Date({
  date,
  onDateChange,
  placeholder = "Pick a date",
}: DateProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[133px] justify-start text-left font-normal bg-transparent border-[#242428] text-[#CBD2EB] hover:text-white hover:bg-[#1a1a1a] h-10",
            !date && "text-[#CBD2EB]",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#CBD2EB]" />
          {date ? (
            format(date, "dd-MM-yyyy")
          ) : (
            <span className="text-sm">{placeholder}</span>
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
          initialFocus
          className="bg-[#1a1a1a] text-white border-0"
          classNames={{
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
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
