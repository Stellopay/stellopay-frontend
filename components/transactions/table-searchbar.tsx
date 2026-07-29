"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TableSearchbarProps {
  /** Optional initial or controlled search string value. */
  value?: string;
  onSearch: (value: string) => void;
  /** Debounce delay in milliseconds before `onSearch` fires. Defaults to 300ms. */
  debounceMs?: number;
}

const TableSearchbar = ({
  value: initialValue = "",
  onSearch,
  debounceMs = 300,
}: TableSearchbarProps) => {
  const [value, setValue] = useState(initialValue);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Debounce the search callback so it doesn't fire on every keystroke.
  useEffect(() => {
    if (value === initialValue) {
      return;
    }

    const timer = setTimeout(() => {
      onSearchRef.current(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, initialValue]);

  return (
    <div className="flex items-center bg-transparent rounded-[6.25rem]">
      <Search
        className="w-5 h-5 text-gray-600"
        aria-hidden="true"
        data-testid="table-searchbar-icon"
      />

      <Input
        type="text"
        placeholder="Search"
        aria-label="Search transactions"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default TableSearchbar;

