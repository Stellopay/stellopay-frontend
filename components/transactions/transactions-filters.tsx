"use client";

import {
  ChevronDown,
  FileCheck,
  Filter,
  Search,
  ChevronsUpDown,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/common/search-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortField, TransactionsFiltersProps } from "@/types/transaction";
import { cn } from "@/utils/commonUtils";

export default function TransactionsFilters({
  searchQuery,
  selectedFilter,
  sortConfigs,
  onSearchChange,
  onFilterChange,
  onSort,
  onAdvancedFilterToggle,
  hasAdvancedFilters = false,
  debounceMs = 300,
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

  // Compute how many filters are active (search, selected filter, advanced filters)
  const activeFilterCount =
    (searchQuery && searchQuery.trim() !== "" ? 1 : 0) +
    (selectedFilter && selectedFilter !== "All Transactions" ? 1 : 0) +
    (hasAdvancedFilters ? 1 : 0);

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
            <Search
              size={16}
              color="#9CA3AF"
              strokeWidth={1.5}
            />
          </span>
          {/* Debounced Search Input */}
          <SearchBar
            placeholder="Search"
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
              onSearchChange('');
              onFilterChange('All Transactions');
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
      </div>
    </div>
  );
}
