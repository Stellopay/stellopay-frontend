"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { SortField, SortConfig, SortDirection } from "@/types/transaction";

const SORT_LABELS: Record<SortField, string> = {
  date: "Date",
  amount: "Amount",
  type: "Type",
  status: "Status",
};

const SORT_DIRECTION_LABELS: Record<SortDirection, string> = {
  asc: "\u2191",
  desc: "\u2193",
};

const SORT_DIRECTION_WORDS: Record<SortDirection, string> = {
  asc: "ascending",
  desc: "descending",
};

export interface SortProps {
  sortConfigs: SortConfig[];
  onSort: (field: SortField, options?: { shiftKey?: boolean }) => void;
  onClearSecondarySort?: () => void;
}

type AriaSortValue = "ascending" | "descending" | "other" | undefined;

function ariaSortForField(
  field: SortField,
  configs: readonly SortConfig[],
): AriaSortValue {
  for (const [idx, cfg] of configs.entries()) {
    if (cfg.field !== field) continue;
    if (idx === 0) {
      return cfg.direction === "asc" ? "ascending" : "descending";
    }
    return "other";
  }
  return undefined;
}

function buildSortAnnouncement(configs: readonly SortConfig[]): string {
  if (configs.length === 0) return "No sort applied.";
  const primary = configs[0]!;
  const parts = [
    `Sorted by ${SORT_LABELS[primary.field]} ${SORT_DIRECTION_WORDS[primary.direction]}`,
  ];
  const secondary = configs[1];
  if (secondary) {
    parts.push(
      `then by ${SORT_LABELS[secondary.field]} ${SORT_DIRECTION_WORDS[secondary.direction]}`,
    );
  }
  return `${parts.join(" ")}.`;
}

const SortControl = ({
  sortConfigs,
  onSort,
  onClearSecondarySort,
}: SortProps) => {
  const primarySort = sortConfigs[0];
  const secondarySort = sortConfigs[1];

  const initialMountRef = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    setAnnouncement(buildSortAnnouncement(sortConfigs));
  }, [sortConfigs]);

  const triggerLabel = useMemo(() => {
    if (!primarySort) return "Sort transactions";
    return `Sort transactions. Currently sorted by ${SORT_LABELS[primarySort.field]} ${SORT_DIRECTION_WORDS[primarySort.direction]}${
      secondarySort
        ? `, then by ${SORT_LABELS[secondarySort.field]} ${SORT_DIRECTION_WORDS[secondarySort.direction]}`
        : ""
    }. Press Enter or Space to open the sort menu.`;
  }, [primarySort, secondarySort]);

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

  const handleItemClick = (
    field: SortField,
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    const shiftKey =
      "shiftKey" in e ? Boolean((e as React.MouseEvent).shiftKey) : false;
    onSort(field, { shiftKey });
  };

  const handleItemKeyDown = (
    field: SortField,
    e: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleItemClick(field, e);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div
        role="rowgroup"
        aria-label="Transaction sort state"
        className="sr-only"
      >
        <div role="row">
          {(Object.keys(SORT_LABELS) as SortField[]).map((field) => {
            const ariaSort = ariaSortForField(field, sortConfigs);
            return (
              <div
                key={field}
                role="columnheader"
                aria-sort={ariaSort}
                data-testid={`sort-columnheader-${field}`}
              >
                {SORT_LABELS[field]}
              </div>
            );
          })}
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="sort-announcement"
      >
        {announcement}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="text-gray-400 hover:text-white hover:bg-[#1a0c1d]"
            aria-label={triggerLabel}
          >
            <ChevronsUpDown
              size={20}
              color="currentColor"
              strokeWidth={1.5}
              className="mr-2"
              aria-hidden="true"
            />
            <span>
              {primarySort
                ? `${SORT_LABELS[primarySort.field]} ${SORT_DIRECTION_LABELS[primarySort.direction]}`
                : "Sort"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-[#160f17] border-[#2D2D2D] min-w-[180px]"
          role="menu"
          aria-label="Sort columns"
        >
          {(["date", "amount", "type", "status"] as SortField[]).map(
            (field) => {
              const order = getSortOrder(field);
              const ariaSort = ariaSortForField(field, sortConfigs);
              const ariaChecked =
                ariaSort === "ascending" || ariaSort === "descending"
                  ? true
                  : ariaSort === "other"
                    ? "mixed"
                    : false;
              return (
                <DropdownMenuItem
                  key={field}
                  role="menuitemcheckbox"
                  aria-checked={ariaChecked}
                  className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                  onClick={(e) => handleItemClick(field, e)}
                  onKeyDown={(e) => handleItemKeyDown(field, e)}
                  data-testid={`sort-item-${field}`}
                >
                  <span className="flex items-center justify-between w-full gap-3">
                    <span className="flex items-center gap-2">
                      <span>Sort by {SORT_LABELS[field]}</span>
                      {order !== null && (
                        <span className="text-xs text-gray-400">
                          {
                            SORT_DIRECTION_LABELS[
                              sortConfigs[order - 1]!.direction
                            ]
                          }
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
            },
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {secondarySort && onClearSecondarySort && (
        <div
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-[#1a0c1d] border border-[#3E3E3E] text-xs text-gray-300"
          role="group"
          aria-label={`Secondary sort: ${SORT_LABELS[secondarySort.field]} ${SORT_DIRECTION_WORDS[secondarySort.direction]}`}
        >
          <span>
            then {SORT_LABELS[secondarySort.field]}{" "}
            {SORT_DIRECTION_LABELS[secondarySort.direction]}
          </span>
          <button
            type="button"
            aria-label={`Clear secondary sort by ${SORT_LABELS[secondarySort.field]}`}
            onClick={onClearSecondarySort}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClearSecondarySort?.();
              }
            }}
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
