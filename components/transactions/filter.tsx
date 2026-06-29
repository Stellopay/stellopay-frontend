"use client";

import React, { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { ListFilter, X } from "lucide-react";

interface FilterProps {
  /** Current committed transaction filter text. Treated as plain text only. */
  value: string;
  /** Receives debounced filter text changes, or an immediate empty string on clear. */
  onChange: (value: string) => void;
  /** Debounce delay in milliseconds before `onChange` fires. Defaults to 300ms. */
  debounceMs?: number;
}

const Filter = ({ value, onChange, debounceMs = 300 }: FilterProps) => {
  const [draftValue, setDraftValue] = useState(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    if (draftValue === value) {
      return;
    }

    const timer = setTimeout(() => {
      onChangeRef.current(draftValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [draftValue, debounceMs, value]);

  const clearFilter = () => {
    setDraftValue("");
    onChangeRef.current("");
  };

  return (
    <div className="flex items-center bg-transparent rounded-[6.25rem]">
      <ListFilter
        aria-hidden="true"
        data-testid="transactions-filter-icon"
        className="text-gray-600 w-5 h-5"
      />
      <Input
        type="text"
        placeholder="Filter"
        aria-label="Filter transactions"
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        className="border-none py-1 focus-visible:ring-0 text-[13px] p-1 sm:text-[14px]"
      />
      {draftValue && (
        <button
          type="button"
          aria-label="Clear transaction filter"
          onClick={clearFilter}
          className="rounded-full p-1 text-gray-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Filter;
