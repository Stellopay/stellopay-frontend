"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/commonUtils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterChip {
  /** Unique key for the chip (used for removal). */
  key: string;
  /** Display label for the filter dimension. */
  label: string;
  /** Display value for the active filter. */
  value: string;
}

export interface FilterChipsProps {
  /** Active filter chips to display. */
  chips: FilterChip[];
  /** Called when a chip's remove button is clicked, with the chip key. */
  onRemove: (key: string) => void;
  /** Called when "Clear All" is clicked. */
  onClearAll: () => void;
  /** Additional class name for the container. */
  className?: string;
  /** Accessible label for the chips region. */
  ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FilterChips = ({
  chips,
  onRemove,
  onClearAll,
  className,
  ariaLabel = "Active filters",
}: FilterChipsProps) => {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="region"
      aria-label={ariaLabel}
    >
      <span className="text-xs text-gray-500 font-medium mr-1">
        Active Filters:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs",
            "bg-[#1a0c1d] border border-[#3E3E3E] text-gray-200",
            "transition-colors hover:border-gray-500",
          )}
        >
          <span className="font-medium text-gray-400">{chip.label}:</span>
          <span className="max-w-[160px] truncate">{chip.value}</span>
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter: ${chip.value}`}
            onClick={() => onRemove(chip.key)}
            className={cn(
              "ml-0.5 rounded-full p-0.5 text-gray-500 hover:text-white hover:bg-gray-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500",
              "transition-colors",
            )}
          >
            <X size={12} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          aria-label="Clear all active filters"
          onClick={onClearAll}
          className={cn(
            "text-xs text-gray-500 hover:text-white underline underline-offset-2",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 rounded px-1",
            "transition-colors ml-1",
          )}
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default FilterChips;
