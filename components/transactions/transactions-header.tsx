"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

import { HugeiconsIcon } from "@hugeicons/react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/commonUtils";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { TransactionsHeaderProps } from "@/types/transaction";
import { formatDateForInput, formatDateForDisplay } from "@/utils/dateUtils";

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

      {/* Date Range Picker */}
      <div className="flex items-center gap-3">
        {/* From Date Picker */}
        <Popover open={fromDateOpen} onOpenChange={setFromDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                " w-[2000px] justify-start  font-normal px-[13px] py-[8px] bg-[#1a0c1d] border border-[#242428]",
                !fromDateObj && "text-muted-foreground",
              )}
            >
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.8}
                className="mr-4"
              />
              {fromDateObj ? formatDateForDisplay(fromDateObj) : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDateObj}
              onSelect={handleFromDateSelect}
              disabled={(date) => {
                if (!toDateObj) return false;
                return date > toDateObj;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-gray-400 text-sm">Tom</span>

        {/* To Date Picker */}
        <Popover open={toDateOpen} onOpenChange={setToDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal bg-[#1a0c1d] border border-[#242428]",
                !toDateObj && "text-muted-foreground",
              )}
            >
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.8}
                className="mr-2"
              />
              {toDateObj ? formatDateForDisplay(toDateObj) : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDateObj}
              onSelect={handleToDateSelect}
              disabled={(date) => {
                if (!fromDateObj) return false;
                return date < fromDateObj;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
