"use client";

import {
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
  ArrowUpDownIcon,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortField, SortDirection } from "@/types/transaction";

interface TransactionsFiltersProps {
  searchQuery: string;
  selectedFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onSort: (field: SortField) => void;
}

export default function TransactionsFilters({
  searchQuery,
  selectedFilter,
  sortField,
  sortDirection,
  onSearchChange,
  onFilterChange,
  onSort,
}: TransactionsFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4  rounded-lg  bg-[#160f17]">
      {/* Transaction Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-base text-white hover:bg-[#160f17] hover:text-white justify-start"
          >
            <CalendarClock className="w-8 h-8" />
            {selectedFilter}
            <ChevronDownIcon className="h-4 w-4" />
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

      {/* Search and Controls */}
      <div className="flex items-center gap-3 mt-4 lg:mt-0">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-400 focus:border-gray-600"
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#1a0c1d]"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filter
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
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#1a0c1d]"
            >
              <ArrowUpDownIcon className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#160f17] border-[#2D2D2D]">
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onSort("date")}
            >
              Sort by Date{" "}
              {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onSort("amount")}
            >
              Sort by Amount{" "}
              {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onSort("type")}
            >
              Sort by Type{" "}
              {sortField === "type" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-gray-800"
              onClick={() => onSort("status")}
            >
              Sort by Status{" "}
              {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
