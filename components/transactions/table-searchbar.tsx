"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TableSearchbarProps {
  onSearch: (value: string) => void;
  debounceMs?: number;
}

const TableSearchbar = ({
  onSearch,
  debounceMs = 300,
}: TableSearchbarProps) => {
  const [query, setQuery] = useState("");
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, onSearch, query]);

  return (
    <div className="flex items-center bg-transparent rounded-[6.25rem]   ">
      <Search className="w-5 h-5 text-gray-600 " aria-hidden="true" />

      <Input
        aria-label="Search transactions"
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
    </div>
  );
};

export default TableSearchbar;
