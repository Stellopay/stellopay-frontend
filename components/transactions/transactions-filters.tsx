import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  DocumentValidationIcon,
  FilterMailSquareIcon,
  Search01Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  SortField,
  SortDirection,
  TransactionsFiltersProps,
} from "@/types/transaction";

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
      {/* Transaction Type Filter - Updated Section */}
      <div className="flex items-center gap-2">
        {/* Calendar icon now outside button but visually aligned */}
        <div className="bg-[#110e11] p-2 rounded-lg border border-[#3E3E3E] inline-flex items-center justify-center">
          <HugeiconsIcon
            icon={DocumentValidationIcon}
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
              className="text-xl text-white hover:bg-[#160f17] hover:text-white px-2"
            >
              {selectedFilter}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
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
          </DropdownMenuContent>{" "}
        </DropdownMenu>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-3 mt-4 lg:mt-0">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              color="#9CA3AF" // gray-400
              strokeWidth={1.5}
            />
          </span>
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
              size="default"
              className="text-gray-400 hover:text-white hover:bg-[#1a0c1d] "
            >
              <HugeiconsIcon
                icon={FilterMailSquareIcon}
                size={20}
                color="currentColor"
                strokeWidth={1.5}
                className="mr-2"
              />
              <span className="text-base">Filter</span>
              {/* Responsive text */}
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
              <HugeiconsIcon
                icon={UnfoldMoreIcon}
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
