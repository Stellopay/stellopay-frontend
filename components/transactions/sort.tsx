"use client";

import React from "react";
import { ChevronsUpDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { SortField, SortConfig, SortDirection } from "@/types/transaction";

/** Column labels shown in the sort menu. */
const SORT_LABELS: Record<SortField, string> = {
  date: "Date",
  amount: "Amount",
  type: "Type",
  status: "Status",
};

const SORT_DIRECTION_LABELS: Record<SortDirection, string> = {
  asc: "↑",
  desc: "↓",
};

export interface SortProps {
  /** Ordered list of active sort criteria. */
  sortConfigs: SortConfig[];
  /**
   * Called when a sort option is selected.
   * - Normal click: sets/ toggles the primary sort.
   * - Shift+click: adds/modifies the secondary sort when field differs from primary.
   */
  onSort: (field: SortField, options?: { shiftKey?: boolean }) => void;
  /** Callback to clear the secondary sort. */
  onClearSecondarySort?: () => void;
}

/**
 * Multi-column sort control for transactions.
 *
 * Renders a dropdown with sortable fields. The currently active sort(s) are
 * indicated by arrows (↑/↓) and an optional "#2" badge for the secondary key.
 * Shift-clicking a field sets it as the secondary sort.
 */
const SortControl = ({
  sortConfigs,
  onSort,
  onClearSecondarySort,
}: SortProps) => {
  const primarySort = sortConfigs[0];
  const secondarySort = sortConfigs[1];

  const renderSortIndicator = (field: SortField): string => {
    const parts: string[] = [];
    for (const config of sortConfigs) {
      if (config.field === field) {
        parts.push(SORT_DIRECTION_LABELS[config.direction]);
      }
    }
    return parts.join(" ");
  };

  const getSortOrder = (field: SortField): number | null => {
    const idx = sortConfigs.findIndex((c) => c.field === field);
    return idx >= 0 ? idx + 1 : null;
  };

  /** Build a human-readable description of the active sort(s) for screen readers. */
  function renderSortDescription(configs: SortConfig[]): string {
    if (configs.length === 0) return "No sort applied.";
    const parts = configs.map((c, i) => {
      const dir = c.direction === "asc" ? "ascending" : "descending";
      return i === 0
        ? `Sorted by ${SORT_LABELS[c.field]} ${dir}`
        : `then by ${SORT_LABELS[c.field]} ${dir}`;
    });
    return parts.join(", ") + ".";
  }

  /** Human-readable description of the active sort(s) for screen readers. */
  const liveSortDescription = renderSortDescription(sortConfigs);

  return (
    <div className="flex items-center gap-1">
      {/* Visually-hidden live region that announces sort changes to screen
          readers. aria-live="polite" keeps announcements from interrupting
          the user's current task. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="sort-announcement"
      >
        {liveSortDescription}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="text-gray-400 hover:text-white hover:bg-[#1a0c1d]"
            aria-label={`Sort transactions. ${liveSortDescription}`}
          >
            <ChevronsUpDown
              size={20}
              color="currentColor"
              strokeWidth={1.5}
              className="mr-2"
            />
            <span>
              {primarySort
                ? `${SORT_LABELS[primarySort.field]} ${SORT_DIRECTION_LABELS[primarySort.direction]}`
                : "Sort"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#160f17] border-[#2D2D2D] min-w-[180px]">
          {(
            ["date", "amount", "type", "status"] as SortField[]
          ).map((field) => {
            const order = getSortOrder(field);
            return (
              <DropdownMenuItem
                key={field}
                className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                onClick={(e) => onSort(field, { shiftKey: e.shiftKey })}
              >
                <span className="flex items-center justify-between w-full gap-3">
                  <span className="flex items-center gap-2">
                    <span>Sort by {SORT_LABELS[field]}</span>
                    {order !== null && (
                      <span className="text-xs text-gray-400">
                        {SORT_DIRECTION_LABELS[sortConfigs[order - 1]!.direction]}
                        {order > 1 && (
                          <span className="ml-0.5 text-[10px] text-gray-500">
                            #{order}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Secondary sort chip */}
      {secondarySort && onClearSecondarySort && (
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-[#1a0c1d] border border-[#3E3E3E] text-xs text-gray-300">
          <span>
            then {SORT_LABELS[secondarySort.field]}{" "}
            {SORT_DIRECTION_LABELS[secondarySort.direction]}
          </span>
          <button
            type="button"
            aria-label="Clear secondary sort"
            onClick={onClearSecondarySort}
            className="ml-1 rounded-full p-0.5 text-gray-500 hover:text-white hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            <X aria-hidden="true" className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SortControl;
