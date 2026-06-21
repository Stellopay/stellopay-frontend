import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TableSearchbarProps {
  onSearch: (value: string) => void;
  value?: string;
  debounceMs?: number;
  ariaLabel?: string;
}

/**
 * Debounced transaction search input for table-level filtering.
 */
const TableSearchbar = ({
  onSearch,
  value = "",
  debounceMs = 250,
  ariaLabel = "Search transactions",
}: TableSearchbarProps) => {
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, onSearch, searchValue]);

  return (
    <div className="flex items-center bg-transparent rounded-[6.25rem]   ">
      <Search className="w-5 h-5 text-gray-600 " />

      <Input
        type="search"
        aria-label={ariaLabel}
        placeholder="Search"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default TableSearchbar;
