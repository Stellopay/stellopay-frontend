"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  FileCheck,
  Filter,
  Search,
  ChevronsUpDown,
  SlidersHorizontal,
  Bookmark,
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/common/search-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  SortField,
  SavedView,
  TransactionsFiltersProps,
} from "@/types/transaction";
import { cn } from "@/utils/commonUtils";

/** Maximum length for a saved view name (mirrors the constant in transactions-content). */
const MAX_VIEW_NAME_LENGTH = 50;
/** Maximum number of saved views per account. */
const MAX_SAVED_VIEWS = 10;

export default function TransactionsFilters({
  searchQuery,
  selectedFilter,
  sortConfigs,
  onSearchChange,
  onFilterChange,
  onSort,
  onAdvancedFilterToggle,
  hasAdvancedFilters = false,
  savedViews = [],
  onSaveView,
  onLoadView,
  onRenameView,
  onDeleteView,
}: TransactionsFiltersProps) {
  const renderSortIndicator = (field: SortField) => {
    const indicators: string[] = [];
    for (const [idx, config] of sortConfigs.entries()) {
      if (config.field === field) {
        const arrow = config.direction === "asc" ? "\u2191" : "\u2193";
        const label = idx === 0 ? arrow : `${arrow} #${idx + 1}`;
        indicators.push(label);
      }
    }
    return indicators.length > 0 ? indicators.join(" ") : "";
  };

  const handleSaveViewAction = () => {
    if (!onSaveView) return;
    const name = window.prompt(
      `Name this view (max ${MAX_VIEW_NAME_LENGTH} characters):`,
    );
    if (name !== null && name.trim()) {
      onSaveView(name.trim().slice(0, MAX_VIEW_NAME_LENGTH));
    }
  };

  const canSaveView =
    onSaveView && savedViews.length < MAX_SAVED_VIEWS;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 rounded-lg bg-[#160f17]">
      {/* Transaction Type Filter */}
      <div className="flex items-center gap-2">
        <div className="bg-[#110e11] p-2 rounded-lg border border-[#3E3E3E] inline-flex items-center justify-center">
          <FileCheck
            size={35}
            color="currentColor"
            strokeWidth={1.5}
            className="text-white"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative text-xl text-white hover:bg-[#160f17] hover:text-white px-2"
            >
              {selectedFilter}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[#34D399] text-black">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={16}
                color="currentColor"
                strokeWidth={2}
                className="ml-1"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-[#2D2D2D] bg-[#160f17]">
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onFilterChange("All Transactions")}
            >
              All Transactions
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onFilterChange("Payment Sent")}
            >
              Payment Sent
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onFilterChange("Payment Received")}
            >
              Payment Received
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-3 mt-4 lg:mt-0">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search size={16} color="#9CA3AF" strokeWidth={1.5} />
          </span>
          {/* Debounced Search Input */}
          <SearchBar
            placeholder="Search"
            ariaLabel="Search transactions"
            value={searchQuery}
            onSearch={onSearchChange}
            debounceMs={debounceMs}
            className="pl-10 bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-400 focus:border-gray-600"
          />
        </div>

        {/* Advanced Filter Toggle Button */}
        {onAdvancedFilterToggle && (
          <Button
            variant="ghost"
            size="default"
            onClick={onAdvancedFilterToggle}
            aria-label="Open advanced filters"
            className={cn(
              "text-gray-400 hover:text-white hover:bg-[#1a0c1d] relative",
              hasAdvancedFilters && "text-[#34D399]",
            )}
          >
            <SlidersHorizontal
              size={20}
              color="currentColor"
              strokeWidth={1.5}
              className="mr-2"
            />
            <span className="text-base hidden sm:inline">Advanced</span>
            {hasAdvancedFilters && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34D399]" />
              </span>
            )}
          </Button>
        )}

        {/* Clear All Filters */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange("");
            onFilterChange("All Transactions");
          }}
          aria-label="Clear all filters"
          className="text-gray-400 hover:text-white"
        >
          Clear all
        </Button>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="default"
              className="text-gray-400 hover:text-white hover:bg-[#1a0c1d] "
            >
              <Filter
                size={20}
                color="currentColor"
                strokeWidth={1.5}
                className="mr-2"
              />
              <span className="text-base">Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#160f17] border-[#2D2D2D]">
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onFilterChange("All Transactions")}
            >
              All Transactions
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onFilterChange("Payment Sent")}
            >
              Payment Sent Only
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onFilterChange("Payment Received")}
            >
              Payment Received Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="default"
              className="text-gray-400 hover:text-white hover:bg-[#1a0c1d] "
            >
              <ChevronsUpDown
                size={20}
                color="currentColor"
                strokeWidth={1.5}
                className="mr-2"
              />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#160f17] border-[#2D2D2D]">
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={(e) => onSort("date", { shiftKey: e.shiftKey })}
            >
              <span className="flex items-center gap-2">
                Sort by Date
                {renderSortIndicator("date") && (
                  <span className="text-xs text-gray-400">
                    {renderSortIndicator("date")}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={(e) => onSort("amount", { shiftKey: e.shiftKey })}
            >
              <span className="flex items-center gap-2">
                Sort by Amount
                {renderSortIndicator("amount") && (
                  <span className="text-xs text-gray-400">
                    {renderSortIndicator("amount")}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={(e) => onSort("type", { shiftKey: e.shiftKey })}
            >
              <span className="flex items-center gap-2">
                Sort by Type
                {renderSortIndicator("type") && (
                  <span className="text-xs text-gray-400">
                    {renderSortIndicator("type")}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={(e) => onSort("status", { shiftKey: e.shiftKey })}
            >
              <span className="flex items-center gap-2">
                Sort by Status
                {renderSortIndicator("status") && (
                  <span className="text-xs text-gray-400">
                    {renderSortIndicator("status")}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Saved Views Section ──────────────────────────────────────── */}

        {/* Save Current View Button */}
        {canSaveView && (
          <Button
            variant="ghost"
            size="default"
            onClick={handleSaveViewAction}
            aria-label="Save current view"
            className="text-gray-400 hover:text-white hover:bg-[#1a0c1d]"
          >
            <Bookmark
              size={20}
              color="currentColor"
              strokeWidth={1.5}
              className="mr-2"
            />
            <span className="text-base hidden sm:inline">Save</span>
          </Button>
        )}

        {/* Saved Views Dropdown */}
        {onLoadView && savedViews.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                aria-label="Saved views"
                className="text-gray-400 hover:text-white hover:bg-[#1a0c1d]"
              >
                <Bookmark
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="mr-2"
                />
                <span className="text-base hidden sm:inline">
                  Views
                  <span className="ml-1 text-xs text-gray-500">
                    {savedViews.length}
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  color="currentColor"
                  strokeWidth={2}
                  className="ml-1 hidden sm:inline"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-[#160f17] border-[#2D2D2D] min-w-[220px]"
              align="end"
            >
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saved Views
              </div>
              <DropdownMenuSeparator className="bg-[#2D2D2D]" />
              {savedViews.map((view) => (
                <SavedViewItem
                  key={view.id}
                  view={view}
                  onLoad={onLoadView}
                  onRename={onRenameView}
                  onDelete={onDeleteView}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/** ── Saved View Item (inline edit, delete) ──────────────────────────── */

interface SavedViewItemProps {
  view: SavedView;
  onLoad: (view: SavedView) => void;
  onRename?: (view: SavedView, newName: string) => void;
  onDelete?: (view: SavedView) => void;
}

function SavedViewItem({ view, onLoad, onRename, onDelete }: SavedViewItemProps) {
  // Simple inline-rename state
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(view.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleCommitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== view.name && onRename) {
      onRename(view, trimmed.slice(0, MAX_VIEW_NAME_LENGTH));
    }
    setEditing(false);
    setEditValue(view.name);
  };

  const handleCancelRename = () => {
    setEditing(false);
    setEditValue(view.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelRename();
    }
  };

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 group"
      role="group"
      aria-label={`Saved view: ${view.name}`}
    >
      {editing ? (
        /* Inline rename input */
        <div className="flex items-center gap-1 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCommitRename}
            onKeyDown={handleKeyDown}
            maxLength={MAX_VIEW_NAME_LENGTH}
            aria-label="Rename saved view"
            className="flex-1 bg-[#1A1A1A] border border-[#2D2D2D] rounded px-2 py-1 text-sm text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#04842E]"
          />
          <button
            type="button"
            onClick={handleCommitRename}
            aria-label="Confirm rename"
            className="p-1 text-gray-400 hover:text-[#34D399] transition-colors focus-visible:ring-2 focus-visible:ring-[#04842E] rounded"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={handleCancelRename}
            aria-label="Cancel rename"
            className="p-1 text-gray-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-[#04842E] rounded"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          {/* Load button (primary action) */}
          <button
            type="button"
            onClick={() => onLoad(view)}
            className="flex-1 text-left text-sm text-white hover:text-[#34D399] transition-colors py-1 rounded focus-visible:ring-2 focus-visible:ring-[#04842E] focus-visible:outline-none"
            aria-label={`Load saved view: ${view.name}`}
          >
            <span className="block truncate max-w-[150px]">{view.name}</span>
          </button>

          {/* Action buttons (visible on hover/focus; always visible on touch/small screens) */}
          <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
            {onRename && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                aria-label={`Rename saved view: ${view.name}`}
                className="p-1 text-gray-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-[#04842E] rounded"
              >
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      `Delete saved view "${view.name}"? This cannot be undone.`,
                    )
                  ) {
                    onDelete(view);
                  }
                }}
                aria-label={`Delete saved view: ${view.name}`}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 rounded"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
